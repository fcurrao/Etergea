import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FilterComponent } from './filter/filter.component'; 
import { HomeComponent } from './home/home.component';
import { StatesComponent } from './states/states.component'; 
import { ManagementComponent } from './management/management.component'; 
import { MapsComponent } from './maps/maps.component'; 
import { MapsContainerComponent } from './mapsContainer/mapsContainer.component'; 
import { UserComponent } from './user/user.component'; 


const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: FilterComponent }, 
  // { path: 'states', component: StatesComponent },
  // { path: 'management', component: ManagementComponent },
  { path: 'maps', component: MapsContainerComponent },
  // { path: 'user', component: UserComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }