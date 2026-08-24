import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Container } from 'src/app/data/container/container';
import { Store } from 'src/app/data/shared/store';
import { MasterTablesService } from 'src/app/services/api/masterTables/master-tables.service';
import { sortArrayBy } from '../../utils/array-utils';

@Component({
  selector: 'm-store-select',
  templateUrl: './store-select.component.html',
  styleUrls: ['./store-select.component.scss']
})
export class StoreSelectComponent implements OnInit {

  @Input()
  public options: Store[];

  @Input()
  public placeholder: string;

  @Input()
  public selectedValue: string;

  @Output()
  public valueSelected: EventEmitter<Container> = new EventEmitter<Container>();

  public constructor(
    private readonly masterTablesService: MasterTablesService
  ) { }

  public ngOnInit(): void {
    this.getStores();
  }
  public onChange(value: string): void {
    const valueJ = JSON.parse(value);
    this.valueSelected.emit(valueJ);
  }

  public isSelected(value: string): boolean {
    return value === this.selectedValue;
  }

  public toStr(value: Container) {
    return JSON.stringify(value);
  }

  public getStores(): void {
    this.masterTablesService.getStores()
      .subscribe((stores: any) => {
        this.options = stores;
        this.options =  stores.filter((s: Store) => s.codigo !== '0');

        this.options = this.sortedByCodes(this.options);
      });
  }
  private sortedByCodes(stores: Store[]): Store[] {
    return  stores.sort(sortArrayBy('code'));
  }
}
