import { Component, ViewChild, TemplateRef, ElementRef } from '@angular/core';

@Component({
  selector: 'm-column-tables-row',
  templateUrl: './column-tables-row.component.html'
})
export class ColumnTablesRowComponent {

  @ViewChild('innerTemplate', { static: false })
  public innerTemplate!: TemplateRef<any>;

  public constructor(
    public element: ElementRef
  ) { }

}
