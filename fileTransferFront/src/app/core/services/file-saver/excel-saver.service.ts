import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root'
})
export class ExcelSaver {
  public save(fileName: string, content: Blob) {
    saveAs(content, fileName);
  }
}
