import { Injectable } from '@angular/core';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  public constructor(
    private datePipe: DatePipe,
    private readonly translate: TranslateService
  ) { }

  public generateExcel(name: string, title: string, header: string[],
    // tslint:disable-next-line: align
    data: Array<Array<string | number | Date>>, columnsWidth?: ColumnsWidth[], columnsFormat?: ColumnsFormat[]) {

    // Create workbook and worksheet
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(this.translate.instant('EXCEL.HOJA_EXCEL'));
    // Add Row and formatting
    const titleRow = worksheet.addRow([title]);
    titleRow.font = { name: 'Arial Black', family: 4, size: 16, underline: 'double', bold: true };
    worksheet.addRow([]);
    worksheet.addRow([this.translate.instant('EXCEL.FECHA_EXCEL') + this.datePipe.transform(new Date(), 'medium')]);

    // Blank Row
    worksheet.addRow([]);
    // Add Header Row
    const headerRow = worksheet.addRow(header);

    // Cell Style : Fill and Border
    headerRow.eachCell(cell => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0F4DBC' },
      };
      cell.font = { color: { argb: 'FFFFFFFF' }, size: 12, bold: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    data.forEach((d, index) => {
      const row = worksheet.addRow(d);
      row.alignment = {horizontal: 'left' };

      let color = 'FFe2f5fa';

      if (index % 2 === 0) {
        color = 'FFe2f5fa';
      } else {
        color = 'FFFFFFFF';

      }
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };
    });

    if (columnsWidth) {
      columnsWidth.forEach(colWidth => worksheet.getColumn(colWidth.column).width = colWidth.width);
    }

    if (columnsFormat) {
      columnsFormat.forEach(colStyle => {
        const column = worksheet.getColumn(colStyle.column);
        column.numFmt =  colStyle.format;
      });
      // worksheet.getColumn(colStyle.column).style?.numFmt = colStyle.format);
    }

    worksheet.addRow([]);

    //Generate Excel File with given name
    workbook.xlsx.writeBuffer().then(resp => {
      const currentDate = Date.now();
      const fileName = this.datePipe.transform(currentDate, 'yyyyMMdd') + name;
      const blob = new Blob([resp], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      fs.saveAs(blob, fileName);
    });
  }

  //Transforma una fecha local en un objeto Date en formato UTC.
  public transformUTCDate(date: Date): Date {
    return new Date( Date.UTC( 
      date.getFullYear(), 
      date.getMonth(), 
      date.getDate(), 
      date.getHours(), 
      date.getMinutes(), 
      date.getSeconds() 
    ));
  }

   
  //Parsea strings de fechas altamente variables con texto libre,
  //formatos europeos, ISO, rangos u horas unidas, devolviendo un objeto Date válido.
  public parsearStringAFecha(fechaStr: string | null | undefined): Date | null {
    if (!fechaStr || fechaStr.trim() === '' || fechaStr === 'NaN') {
      return null;
    }

    try {
      const limpio = fechaStr.trim();

      //CASO 1: Formato ISO (YYYY-MM-DD...) -> Ej: '2026-05-21'
      const regexISO = /^(\d{4})[-/](\d{2})[-/](\d{2})/;
      const matchISO = limpio.match(regexISO);
      
      if (matchISO) {
        const year = parseInt(matchISO[1], 10);
        const month = parseInt(matchISO[2], 10) - 1;
        const day = parseInt(matchISO[3], 10);
        
        //Intentamos extraer una hora básica si existe al inicio del texto restante
        const resto = limpio.substring(matchISO[0].length).trim();
        const matchHora = resto.match(/^(\d{2}):(\d{2})/);
        const hour = matchHora ? parseInt(matchHora[1], 10) : 0;
        const minute = matchHora ? parseInt(matchHora[2], 10) : 0;

        const fecha = new Date(year, month, day, hour, minute, 0);
        return isNaN(fecha.getTime()) ? null : fecha;
      }

      //CASO 2: Formato Europeo (DD.MM.YYYY...) -> Ej: '29.06.2026 PRIMERA HORA', '25.05.2026 08:00-15:00'
      const regexEuropeo = /^(\d{2})[\.-/](\d{2})[\.-/](\d{4})/;
      const matchEuropeo = limpio.match(regexEuropeo);

      if (matchEuropeo) {
        const day = parseInt(matchEuropeo[1], 10);
        const month = parseInt(matchEuropeo[2], 10) - 1;
        const year = parseInt(matchEuropeo[3], 10);

        //Extraemos el residuo de texto después de la fecha para buscar horas
        let resto = limpio.substring(matchEuropeo[0].length).trim();
        
        //Limpiezas comunes de texto basura previo a la hora
        resto = resto.replace(/^(EN|A LAS|HACIA las)\s+/i, '').trim();

        let hour = 0;
        let minute = 0;

        //Buscar formatos de hora: "1630", "16:30", "16:30HRS", "08:00-15:00" (captura la primera)
        const matchHoraConDosPuntos = resto.match(/^(\d{2}):(\d{2})/);
        const matchHoraJunta = resto.match(/^(\d{4})/);

        if (matchHoraConDosPuntos) {
          hour = parseInt(matchHoraConDosPuntos[1], 10);
          minute = parseInt(matchHoraConDosPuntos[2], 10);
        } else if (matchHoraJunta) {
          hour = parseInt(matchHoraJunta[1].substring(0, 2), 10);
          minute = parseInt(matchHoraJunta[1].substring(2, 4), 10);
        }

        const fecha = new Date(year, month, day, hour, minute, 0);
        return isNaN(fecha.getTime()) ? null : fecha;
      }

      //Si no coincide con ninguna estructura numérica conocida
      return null;
    } catch (e) {
      return null;
    }
  }

  //Si es fecha, la procesa y aplica UTC. Si es texto libre ("PENDIENTE"), lo devuelve tal cual.
  public procesarYtransformarFecha(fechaStr: string | null | undefined): Date | string {
    //Si está vacío, devuelve un string en blanco para la celda
    if (!fechaStr || fechaStr.trim() === '' || fechaStr === 'NaN') {
      return '';
    }

    //Intenta parsear el string
    const fechaValida = this.parsearStringAFecha(fechaStr);

    //Si se logró convertir en una fecha real, aplicamos el transformador_UTC
    if (fechaValida) {
      return this.transformUTCDate(fechaValida);
    }

    //Si dio null (porque era "PENDIENTE", "URGENTE", etc.), devuelve el texto original limpio
    return fechaStr.trim();
  }

}

export interface ColumnsWidth {
  column: number;
  width: number;
}

export interface ColumnsFormat {
  column: number;
  format?: string;
  alignment?: string;
}
