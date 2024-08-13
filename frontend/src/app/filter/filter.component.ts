import { Component, OnInit, Renderer2 } from '@angular/core';
import { DataService } from '../services/dataServices';
import { ToastService } from '../services/toastServices';
import { Response } from 'src/app/models/response';
import { data } from '../../assets/data'; // estoy probando la data.... //  ACA ESTA EL JSON COMO VA A SER ! PROBAR ESTO 
import { Data } from '../models/data';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnInit {
  public etergeas: any;
  public ultimo: any;
  public datas: Data[] = [];
  public datasChecked: any[] = [];
  public etergea: any;
  loading: boolean = false;
  allChecked: boolean = false;
  alertToEndYetExist: boolean = false;
  alertToEndNotExist: boolean = false;
  alertSomethingNew: boolean = false;

  constructor(
    private renderer: Renderer2,
    private DataServices: DataService,
    private ToastService: ToastService,

  ) { }


  ngOnInit() {
    // this.DataServices.getAllApis().subscribe((resp:Response<any>)=>{
    //   this.datas = resp.data
    //   this.etergeas = resp.data
    // })

    // this.datas.map((each : any)=>{
    //   this.DataServices.getOneEtergea(each.id).subscribe((resp:data)=>{
    //     const esteDataEtergeaOne = resp
    //     console.log("Cada etergea, los datos estan aca : ", esteDataEtergeaOne)
    //   }) 
    // })

    this.etergeas = data
    this.datas = []
  }


  reebotThis(event: any) {
    console.log("reboot this:" + event);
  }

  testAll = (event?: any) => {
    this.getCheckedEtergeas() // actualizo las checkeadas
    this.loading = true;
    console.log("test all:", this.datasChecked); // Ya tengo las que quiero testear en this.datasChecked
    // ahora tengo que ejecutar el servicio que corra por detras el endpoint de prueba generar (con un forEach para probar todas las seleccionadas)
    this.loading = false;
  }

  resetAll = async () => {
    this.getCheckedEtergeas() // actualizo las checkeadas 
    this.loading = true;
    // ahora tengo que ejecutar el servicio que corra por detras el endpoint de reseteo (con un forEach para resetear todas las seleccionadas)
    // en el segundo parametro booleano pongo si se reinicia o no!, raro..
    try {
      for (const e of this.datasChecked) { 
        console.log('e', e.name);
        const resp: any = await this.DataServices.postResetEtergeas(parseInt(e.name), true).toPromise();
        console.log('Respuesta del servidor:', resp); 
        this.ToastService.show('Se Reinicio los seleccionados', { classname: 'toastInfo blue', delay: 5000 }); 
      }; 
      this.loading = false; 
    } catch (error) { 
      this.ToastService.show('Error al reiniciar', { classname: 'toastInfo red', delay: 5000 });
      console.error('Error:', error);
      this.loading = false;
    }
  }


  deleteAll = () => {
    this.ToastService.show('Se borro toda la lista', { classname: 'toastInfo blue', delay: 5000 });
    this.datas = []
  }

  checkAll = () => {
    this.allChecked = !this.allChecked;
    this.datas.forEach((data: any) => data.checked = this.allChecked);
  }

  getCheckedEtergeas = () => {
    this.datasChecked = []
    this.datas.forEach((data: any) => {
      if (data.checked == true) {
        if (!this.datasChecked.includes(data))
          this.datasChecked.push(data)
      }
    })
  }

  getDeviceStatus(eachEtergea: any, number: number): any {
    const key = Object.keys(eachEtergea)[number];
    console.log("key", key)
    return eachEtergea[key];
  }


  deleteOfList = (event: any) => {
    this.datas = this.datas.filter((data: any) => data.name !== event.name);
    this.ToastService.show("Se saco el " + event.name + " de la lista", { classname: 'toastInfo blue', delay: 5000 });
  }

  cleanInput = () => {
    let idResultValue = document.getElementById('idResult')! as HTMLInputElement
    idResultValue.value = ""
  }

  setInput = () => {
    let idResultValue = document.getElementById('idResult')! as HTMLInputElement
    let idResult = idResultValue.value
    this.cleanInput()
    return idResult;
  }


  addEachOne = async (resultInput: any, multiple?: boolean) => {
    let yetHere = false;
    this.loading = true

    try {
      const resp: any = await this.DataServices.getOneEtergea(resultInput).toPromise();
      if (this.ultimo == resultInput) {
        this.loading = false;
        console.warn("ultimo ", this.ultimo)
      }
      console.log("RESP", resp);

      if (resp.status === 200 || (resp !== undefined && resp !== null)) {
        this.etergea = resp;
        resp.name = String(resultInput);
        resp.checked = true;
        const newResult = this.datas.find((item: any) => item.name === resultInput);
        if (newResult) yetHere = true;
      } else {
        this.etergea = null; // * esto tengo que ver segun como trae la respuesta
      }

      if (yetHere) {
        if (multiple) {
          this.alertToEndYetExist = true;
        } else {
          this.ToastService.show("El " + resultInput + " ya está incorporado este etergea a la lista", { classname: 'toastInfo red', delay: 5000 });
        }
      } else {
        if (!yetHere) {
          this.datas = this.datas.concat(this.etergea);
          if (multiple) {
            this.alertSomethingNew = true;
          } else {
            this.ToastService.show("El etergea " + resultInput + " fue agregado", { classname: 'toastInfo blue', delay: 5000 });
          }
        }
      }
    } catch (error) {
      this.ToastService.show(resultInput + "No existe o falló", { classname: 'toastInfo red', delay: 5000 });
    } finally {
      // this.loading = false;
    }
  }



  addMultiple = (first: any, second: any) => {
    let numbersBetween: number[] = [];
    for (let i: any = first; i <= second; i++) {
      numbersBetween.push(i);
    }
    numbersBetween.map((number: any) => {
      this.addEachOne(number, true)
    })
    setTimeout(() => {
      if (this.alertToEndYetExist) {
        this.ToastService.show("Uno o mas elementos ya estaban en la lista", { classname: 'toastInfo red', delay: 5000 })
        this.alertToEndYetExist = false
      }
      if (this.alertToEndNotExist) {
        this.ToastService.show("Uno o mas elementos No Existen", { classname: 'toastInfo red', delay: 5000 })
        this.alertToEndNotExist = false
      }
      if (this.alertSomethingNew) {
        this.ToastService.show("Fueron agregados", { classname: 'toastInfo blue', delay: 5000 });
        this.alertSomethingNew = false;
      }
    }, 600);
  }

  addToList = () => {
    let resultInput = this.setInput();
    if (resultInput) {
      let stringArray = resultInput.split(',');
      this.ultimo = stringArray[stringArray.length - 1];
      if (this.ultimo.includes('-')) {
        let ultimoSeparado = this.ultimo.split('-');
        this.ultimo = Number(ultimoSeparado[1]);
      }
      stringArray.map((each: any) => {
        let eachString = String(each);
        if (eachString.includes('-')) { // logica para multiple
          let arraySeleccionMultiple = eachString.split('-');
          let start = Number(arraySeleccionMultiple[0]);
          let end = Number(arraySeleccionMultiple[1]);
          this.addMultiple(start, end);
        } else {
          this.addEachOne(each, false); // logica para unico
        }
      });
    } else this.ToastService.show("Escriba la Etergea ", { classname: 'toastInfo red', delay: 5000 });
  };

  ////


}