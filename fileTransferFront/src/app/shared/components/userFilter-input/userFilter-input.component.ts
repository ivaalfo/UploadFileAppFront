import { Component, EventEmitter, Output} from '@angular/core';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'm-userFilter-input',
  templateUrl: './userFilter-input.component.html',
  styleUrls: ['./userFilter-input.component.scss']
})
export class UserFilterInputComponent {

  @Output() onSearch = new EventEmitter<string>();
  @Output() onClear = new EventEmitter<void>();
  
  public search!: string;
  
  public constructor (
    private readonly translate: TranslateService,
    private readonly notification: NotificationService
  ) {}

  public ngOnInit(): void {
    const filtroGuardado = sessionStorage.getItem('filteredUSER');
    if (filtroGuardado) {
      this.search = filtroGuardado;
    }
  }

  public submit(): void {
    //Si el usuario ha borrado el texto, o solo hay espacios, se comporta como el botón "Clear"
    if(!this.search || this.search.trim().length === 0) {
      this.clearClicked();
    } else if(this.search.length < 3){
      const errorTitle = this.translate.instant('FILTERS.MIN_CHARS');
      this.notification.error(errorTitle, true, true);
      return;
    }
    //Si tiene contenido válido (3 o más caracteres), filtramos
    else if(this.search && this.search.length >= 3) {
      sessionStorage.setItem('filteredUSER', this.search);
      //Emitimos el valor al padre
      this.onSearch.emit(this.search);
    }
  }

  public clearClicked(): void {
    this.search = "";
    sessionStorage.removeItem('filteredUSER');
    //Avisamos al padre del borrado
    this.onClear.emit();
  }

}
