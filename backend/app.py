from flask import Flask, request, jsonify
from flask_cors import CORS
from NMEAParser import NMEAParser
from dotenv import load_dotenv
import paramiko
import json
import time
import os

load_dotenv()

app = Flask(__name__)

hostname = os.getenv('HOSTNAME')
port = os.getenv('PORT')
username = os.getenv('USERNAME')
password = os.getenv('PASSWORD')

script_path = '/usr/local/bin/'
scriptPM = 'simplePM.py'
scriptGPS = 'simpleGPS.py'
scriptGPRS = 'simpleGPRS.py'
scriptReset = 'reset.py'

CORS(app)

def extract_error_message(errors):
    """
    Función para extraer el mensaje de la excepción de la salida de stderr
    """
    lines = errors.strip().split('\n')
    
    # Buscar la línea que contiene el mensaje de la excepción
    for line in lines:
        if 'Exception:' in line:
            # Devolver solo el mensaje después de 'Exception:'
            return line.split('Exception:')[-1].strip()
    
    # Si no se encuentra, devolver todo el mensaje de error
    return errors

def ejecutar_script_remoto(hostname, script_name):
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    def try_execute():
        try:
            client.connect(ip_by_ETERGEA(hostname), port=port, username=username, password=password)

            stdin, stdout, stderr = client.exec_command(f'python3 {script_path+script_name}')

            output = stdout.read().decode('utf-8')
            errors = stderr.read().decode('utf-8')

            if errors:
                # Extrae solo el mensaje de la excepción
                errors = extract_error_message(errors)
                raise Exception(errors)

            return json.loads(output), None
        
        except Exception as e:
            return None, str(e)

        finally:
            # Cerrar la conexión SSH
            client.close()
        
    for attempt in range(3):  # Intentos: 0, 1, 2
        result, error_message = try_execute()
        if result is not None:
            return result, None
        time.sleep(2)  # Espera de 2 segundos antes de reintentar

    return None, error_message

def parse_gps(modemsDict):
    nmeaParser = NMEAParser()

    for modem, data in modemsDict.items():

        # Diccionario para almacenar pares de GPGGA y GPRMC
        pairs = {}

        if data['error'] is not None: continue
        # Procesar cada línea del array
        for line in data['data']:
            parts = line.split(',')
            time = parts[1]
            if time not in pairs:
                pairs[time] = {"GPGGA": None, "GPRMC": None}
            
            if line.startswith("$GPGGA"):
                pairs[time]["GPGGA"] = line
            elif line.startswith("$GPRMC"):
                pairs[time]["GPRMC"] = line
        
        for time in pairs:
            pairs[time] = nmeaParser.parse(pairs[time])
        
        modemsDict[modem] = pairs
    
    return modemsDict

def is_valid(GPSData):
    # Inicializar contadores
    count_numSatellites = 0
    count_precision = 0

    # Inicializar variables para encontrar la clave con numSatellites > 3 y precision más baja
    min_precision = float('inf')
    best_value = {'valid': False}

    for key, value in GPSData.items():
        # Verificar numSatellites > 2
        if value.get('numSatellites', 0) > 2:
            count_numSatellites += 1
        
        # Verificar precision < 3
        if value.get('precision', float('inf')) < 3:
            count_precision += 1
        
        # Encontrar la clave con numSatellites > 3 y precision más alta
        if value.get('numSatellites', 0) > 3 and value.get('precision', float('inf')) < min_precision:
            min_precision = value['precision']
            best_value = value
    
    best_value.update({'valid': count_numSatellites >= 3 and count_precision >= 3})
    
    return best_value

def process_gps(gpsOutput):
    GPSData = parse_gps(gpsOutput)

    for modem, modemData in GPSData.items():
        GPSData[modem] = is_valid(modemData)
    
    return GPSData

def process_pm(pmOutput):
    return {k: v == '1' for k, v in pmOutput.items()}

def process_gprs(gprsOutput):
    for key, subdict in gprsOutput.items():
        if isinstance(subdict, dict):
            gprsOutput[key] = all(subdict.values())
    return gprsOutput

def process_output(output, source):
    if source == 'GPS': return process_gps(output)
    elif source == 'GPRS': return process_gprs(output)
    elif source == 'PM': return process_pm(output)

    raise Exception(f"Falla en procesado de datos.")

def response_from_script(output, errors):
    if not errors:
        return {'status': 'success', 'data': output, 'message': 'OK'}, 200
    else:
        return {'status': 'error', 'error': errors}, 500

def ip_by_ETERGEA(idETERGEA):
    return f"10.16.{ ((idETERGEA) // 256) }.{ ((idETERGEA) % 256)}"

def restart_embedded_device():
    ejecutar_script_remoto(hostname, scriptReset)

@app.route('/reset/<int:idETERGEA>', methods=['POST'])
def restart_device(idETERGEA):
    if restart_embedded_device(idETERGEA):
        return jsonify({"status": "Reinicio exitoso"}), 200
    else:
        return jsonify({"error": "Fallo en el reinicio"}), 500

@app.route('/PMstatus/<int:idETERGEA>', methods=['GET'])
def pmStatus(idETERGEA):
    output, errors = ejecutar_script_remoto(idETERGEA, scriptPM)
    output = process_output(output, 'PM')
    res, status = response_from_script(output, errors)
    return jsonify(res), status

@app.route('/GPSstatus/<int:idETERGEA>', methods=['GET'])
def GPSStatus(idETERGEA):
    output, errors = ejecutar_script_remoto(idETERGEA, scriptGPS)
    output = process_output(output, 'GPS')
    res, status = response_from_script(output, errors)
    return jsonify(res), status

@app.route('/GPRSstatus/<int:idETERGEA>', methods=['GET'])
def GPRSStatus(idETERGEA):
    output, errors = ejecutar_script_remoto(idETERGEA, scriptGPRS)
    output = process_output(output, 'GPRS')
    res, status = response_from_script(output, errors)
    return jsonify(res), status

@app.route('/status/<int:idETERGEA>', methods=['GET'])
def status(idETERGEA):

    retDict = {}
    data = {}

    scriptsDict = {'GPS': scriptGPS, 'GPRS': scriptGPRS, 'PM': scriptPM}

    for x in scriptsDict:
        try:
            output, error = ejecutar_script_remoto(idETERGEA, scriptsDict[x])

            output = process_output(output, x)
            # if x == 'GPS':
            #     output = process_gps(output)

            res, res_status = response_from_script(output, error)
            data[x] = res
        except Exception as err:
            data[x] = {'status': 'error', 'error': err}

    # try:
    #     for x in scriptsDict:
    #         output, error = ejecutar_script_remoto(idETERGEA, scriptsDict[x])

    #         if x == 'GPS':
    #             output = process_gps(output)

    #         res, res_status = response_from_script(output, error)
    #         data[x] = res

    # except Exception as err:
    #     retDict['status'] = 'error'
    #     retDict['message'] = 'Internal Server Error'
    #     retDict['error'] = f"Unexpected {err=}, {type(err)=}"
    #     status = 500
    #     return jsonify(retDict), status
    
    if len(data) == len(scriptsDict):
        retDict['status'] = 'success'
        retDict['data'] = data
        retDict['message'] = 'Se obtuvieron correctamente los datos de todas las consultas.'
        status = 200
    elif len(data) > 0:
        retDict['status'] = 'partial_success'
        retDict['data'] = data
        retDict['message'] = 'Algunas consultas se obtuvieron correctamente pero en una o mas se encontraron errores.'
        status = 207
    else:
        retDict['status'] = 'error'
        retDict['message'] = 'Todas las consultas fallaron.'
        status = 500
        
    return jsonify(retDict), status

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

