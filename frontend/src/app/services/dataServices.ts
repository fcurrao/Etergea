
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment'; 
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class DataService {

  constructor(private http: HttpClient) { }

  getAllEtergeas(): Observable<any> {
    return this.http.get(environment.baseUrlTest + environment.portTest + '/all');
  }

  getGPSEtergea(number: any): Observable<any> {
    return this.http.get(environment.baseUrlTest + environment.portTest + `/GPSstatus/${number}`);
  }
  getGPRSEtergea(number: any): Observable<any> {
    return this.http.get(environment.baseUrlTest + environment.portTest + `/GPRSstatus/${number}`);
  }
  getPMEtergea(number: any): Observable<any> {
    return this.http.get(environment.baseUrlTest + environment.portTest + `/PMstatus/${number}`);
  }

  //!   ESTA ES EL ENDPOINT de reinicio !
  postResetEtergeas(id: number, resetModem: boolean): Observable<any> { 
    const body = {
      reset_modem: resetModem
    };
    return this.http.post(environment.baseUrlTest + environment.portTest + `/reset/${id}`, body); 

  }
    // Reinicio
  // @app.route('/reset/<int:id>', methods=['POST'])
  // en el body: 
  // en el body de ese post se puede agregar un parametro opcional 'reset_modem' que va en False si no se quieren reiniciar los modems (tendria que ser un checkbox)
  // 'reset_modem' =  False no se tiene q reiniciar



  //!   ESTA ES EL ENDPOINT de status !
  getOneEtergea(number: any): Observable<any> {
    return this.http.get(environment.baseUrlTest + environment.portTest + `/status/${number}`);
  }
  // return this.http.get(`http://10.2.4.135:5000/status/${number}`) 
    // return this.http.get(`http://192.168.210.15:5000/status/${number}`)
    // return this.http.get(environment.baseUrlTest + environment.portTest + `/status/${number}`);
  
  // getOneEtergea(id:number): Observable<any> { 
    //   return this.http.get<any>(`./assets/${id}.json`);
    // }

    
    //!   OTROS ...

//   curl -X GET http://192.168.210.15:5000/GPSstatus/503
// curl -X GET http://192.168.210.15:5000/GPRSstatus/503
// curl -X GET http://192.168.210.15:5000/PMstatus/503
// curl -X GET http://192.168.210.15:5000/status/503



}