import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService } from '@app/services/api.service';
import { AuthService } from '@app/services/auth.service';
import { HttpInterceptorService } from '@app/services/http-interceptor.service';
import { CategoryModalComponent } from '@app/shared/category-modal/category-modal.component';
import { PlayerComponent } from '@app/shared/player/player.component';
import { SongModalComponent } from '@app/shared/song-modal/song-modal.component';
import { environment } from '@environments/environment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoadingBarModule } from '@ngx-loading-bar/core';
import { LoadingBarHttpClientModule } from '@ngx-loading-bar/http-client';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { CookieService } from 'ngx-cookie-service';
import { NgxGoogleAnalyticsModule, NgxGoogleAnalyticsRouterModule } from 'ngx-google-analytics';
import { FilterByPipe } from 'ngx-pipes';
import { ToastrModule } from 'ngx-toastr';
import { NgxY2PlayerModule } from 'ngx-y2-player';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
    PlayerComponent,
    CategoryModalComponent,
    SongModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    FormsModule,
    NgxY2PlayerModule,
    LoadingBarModule,
    LoadingBarHttpClientModule,
    BrowserAnimationsModule,
    PopoverModule.forRoot(),
    ProgressbarModule.forRoot(),
    ModalModule.forRoot(),
    CollapseModule.forRoot(),
    TooltipModule.forRoot(),
    ToastrModule.forRoot({
      positionClass: 'toast-bottom-right',
    }),
    BrowserAnimationsModule,
    NgxGoogleAnalyticsModule.forRoot(environment.googleAnalytics),
    NgxGoogleAnalyticsRouterModule,
  ],
  entryComponents: [
    CategoryModalComponent,
    SongModalComponent,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true },
    CookieService,
    ApiService,
    AuthService,
    FilterByPipe,
  ],
  bootstrap: [
    AppComponent,
  ],
})
export class AppModule {
}
