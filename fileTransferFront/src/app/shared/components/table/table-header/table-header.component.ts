import { Component, Input } from '@angular/core';

@Component({
  selector: 'm-table-header',
  templateUrl: './table-header.component.html',
  styleUrls: ['./table-header.component.scss']
})
export class TableHeaderComponent {

  @Input()
  public header!: string;

}
