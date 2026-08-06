import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';
import { TranslateService } from '@ngx-translate/core';

const processCell = (value: string | null): string => {
      let cellValue = value || '';
      cellValue = cellValue.replace(/"/g, '""');
      if (cellValue.search(/("|,|\n)/g) >= 0) {
          cellValue = '"' + cellValue + '"';
      }
      return cellValue;
};

const processRow = (row: Array<string|null>): string => {
  const rowWithProcessedCells = row.map(c => processCell(c));
  return rowWithProcessedCells.join(',');
};

@Injectable({
  providedIn: 'root'
})
export class CsvSaver {
  public constructor(
    private readonly translate: TranslateService
  ) { }

  public save(fileName: string, headers: string[], data: Array<Array<string|null>>) {
    const csv = data.map(r => processRow(r));
    const universalBOM = '\uFEFF';
    csv.unshift(headers.map(h => this.translate.instant(h)).join(','));
    const csvArray = universalBOM + csv.join('\r\n');
    const blob = new Blob([csvArray], {
      type: 'text/csv;charset=utf-8'
    });
    saveAs(blob, fileName);
  }
}
