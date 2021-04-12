import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { CommonModule } from '@angular/common';
import { ToastrModule } from 'ngx-toastr';

/* Components */
import { LocationsSearchComponent } from './shared/components/locations-search/locations-search.component';
import { MapActionsComponent } from './shared/components/map-actions/map-actions.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { InfoPanelComponent } from './components/info-panel/info-panel.component';
import { MainComponent } from './components/main/main.component';
import { LocationsListComponent } from './shared/components/locations-list/locations-list.component';
import { AnnotationsListComponent } from './shared/components/annotations-list/annotations-list.component';
import { AppComponent } from './app.component';
/* Directives */
import { ClickElsewhereDirective } from './shared/directives/clickElsewhere.directive';
/* Store */
import { StoreModule } from '@ngrx/store';
import { annotationsReducer } from './state/annotations.reducer';
@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    InfoPanelComponent,
    MapViewComponent,
    MapActionsComponent,
    LocationsSearchComponent,
    LocationsListComponent,
	AnnotationsListComponent,
	ClickElsewhereDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
	FormsModule,
	CommonModule,
    BrowserAnimationsModule,
	ToastrModule.forRoot({}),
	StoreModule.forRoot({ Annotations : annotationsReducer }),

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
