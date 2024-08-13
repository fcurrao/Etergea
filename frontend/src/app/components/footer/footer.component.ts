import { Component, OnInit } from '@angular/core';
import {  APP_VERSION } from '../../../environments/version';


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
 version : any;

  constructor() { }

  ngOnInit() {
    this.version = APP_VERSION;
  }

}
