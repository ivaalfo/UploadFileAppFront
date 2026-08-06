import { Component, HostListener, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedSessionStorage } from '@core/services/storage/shared-session-storage.service';
import { Languages } from '@data/languages';
import { HttpClient } from '@angular/common/http';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { ModalAction } from '@shared/components/modal/modal-action';
import { Subject } from 'rxjs';


@Component({
  selector: 'm-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public sVersion!: string;
  public fechaVersion!: string;
  public htmlMejoras!: string;
  public changeLogText!: string;
  public versionModalTitle!: string;
  public confirmModalOpener$ = new Subject<ModalAction>();

  public constructor (
    private http: HttpClient,
    private translate: TranslateService,
    private readonly sharedSessionStorage: SharedSessionStorage,
    private readonly spinnerService: GlobalSpinnerService
  ) {
    this.translate.setDefaultLang(Languages.ES);
    this.translate.use(Languages.ES);
  }

  public ngOnInit(): void {
    this.checkVersion();
    this.sharedSessionStorage.askForAllStorageInfo();
    
    //Comprueba cada 10 minutos por si hay un pase a producción mientras trabaja
    setInterval(() => {
      this.checkVersion();
    }, 1000 * 60 * 10); 
  }

  @HostListener('window:storage', ['$event'])
  public onStorage($event: StorageEvent) {
    this.sharedSessionStorage.onLocalStorageChanged($event);
  }
  
  private checkVersion() {
    //Añadimos timestamp al JSON para que el servidor nos de el real siempre
    //El 't=' evita caché del JSON
    this.http.get('assets/version.json?t=' + new Date().getTime())
      .subscribe((response: any) => {
        const serverVersion = response.version;
        const currentVersion = localStorage.getItem('app_version');

        //Validamos si la campaña de aviso sigue vigente en tiempo
        const hoy = new Date();
        const fechaExpiracion = new Date(response.expira);
        const estaActivoElAviso = hoy < fechaExpiracion;

        //Evaluamos si hay que mostrar el modal
        //Si está vigente el aviso y si la versión del servidor es distinta a la que tenemos guardada...
        if (estaActivoElAviso && (!currentVersion || serverVersion !== currentVersion)) {
          this.mostrarAvisoActualizacion(response);
        } else {
          //SI LA FECHA YA PASÓ (o si el usuario ya tiene la versión correcta):
          //Grabamos la versión en LocalStorage de forma totalmente SILENCIOSA.
          //Así, los usuarios que entren dos dias despues no verán nada,
          //pero su navegador quedará marcado con la versión nueva automáticamente.
          localStorage.setItem('app_version', serverVersion);
        }
      }, error => console.error("Error al comprobar la versión", error));
  }

  private mostrarAvisoActualizacion(res: any) {
    this.sVersion = res.version;
    this.fechaVersion = res.fecha;
    this.htmlMejoras = res.mejoras;
    
    this.versionModalTitle = this.translate.instant('CONTROL_VERSION.TITLE', { version: this.sVersion });
    this.changeLogText = this.translate.instant('CONTROL_VERSION.CONTENT', { 
      fecha: this.fechaVersion,
      cambios: this.htmlMejoras 
    });

    this.confirmModalOpener$.next(ModalAction.Open);
  }

  public refresh(): void {
    this.spinnerService.show();
    sessionStorage.removeItem('filteredEXP');
    sessionStorage.removeItem('filteredUSER');
    sessionStorage.removeItem('filteredFAC');
    sessionStorage.removeItem('filteredTR');
    sessionStorage.removeItem('filteredRCARGA');

    //Guardamos la versión actual para la próxima comparación
    localStorage.setItem('app_version', this.sVersion);

    //Limpiamos la URL de parámetros anteriores y añadimos el nuevo timestamp
    const baseUrl = window.location.origin + window.location.pathname;
    const hash = window.location.hash; 
    const bust = `cb=${new Date().getTime()}`;

    //Recarga forzada con cache-buster
    window.location.href = `${baseUrl}?${bust}${hash}`;
  }

}
