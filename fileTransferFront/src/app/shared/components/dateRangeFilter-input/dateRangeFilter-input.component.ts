import { Component, EventEmitter, OnInit, Output} from '@angular/core';
import * as moment from 'moment';


@Component({
  selector: 'm-dateRangeFilter-input',
  templateUrl: './dateRangeFilter-input.component.html',
  styleUrls: ['./dateRangeFilter-input.component.scss']
})
export class DateRangeFilterInputComponent implements OnInit {

  //Bindea con el ngModel del input. Guarda el objeto { startDate: ..., endDate: ... }
  public selectedRange: any = null;

  @Output() onSearch =  new EventEmitter<{ fecDesde: string | null, fecHasta: string | null }>();
  @Output() onClear = new EventEmitter<void>();
    
  public constructor () {}

  public ngOnInit(): void {
    const filtroGuardado = sessionStorage.getItem('filteredDATERANGE');
    if (filtroGuardado) {
      try {
        const rangeParsed = JSON.parse(filtroGuardado);
        
        //Rehidratamos los strings a objetos de fecha (moment) para que el input los entienda
        if (rangeParsed && rangeParsed.startDate && rangeParsed.endDate) {
          this.selectedRange = {
            startDate: moment(rangeParsed.startDate),
            endDate: moment(rangeParsed.endDate)
          };
          
          //Si queremos que al volver a la pantalla ejecute la búsqueda automáticamente con lo guardado:
          this.submit();
        }
      } catch (e) {
        console.error("Error parseando el filtro de fechas guardado", e);
        sessionStorage.removeItem('filteredDATERANGE');
      } 
    }
  }

  public submit(): void {
    //Si el usuario no ha seleccionado un rango válido, se comporta como "Clear"
    if (!this.selectedRange || !this.selectedRange.startDate || !this.selectedRange.endDate) {
      this.clearClicked();
      return;
    }

    //Formateamos a String ISO (YYYY-MM-DD) para el backend de Java
    const desdeIso = this.selectedRange.startDate.format('YYYY-MM-DD');
    const hastaIso = this.selectedRange.endDate.format('YYYY-MM-DD');

    //Guardamos el rango en el sessionStorage pasándolo a texto JSON
    const dataToSave = {
      startDate: desdeIso,
      endDate: hastaIso
    };
    sessionStorage.setItem('filteredDATERANGE', JSON.stringify(dataToSave));

    //Emitimos el objeto al padre
    this.onSearch.emit({
      fecDesde: desdeIso,
      fecHasta: hastaIso
    });
  }

  public clearClicked(): void {
    this.selectedRange = null;
    //Limpiamos el sessionStorage
    sessionStorage.removeItem('filteredDATERANGE');
    //Avisamos al padre del borrado
    this.onClear.emit();
  }

}
