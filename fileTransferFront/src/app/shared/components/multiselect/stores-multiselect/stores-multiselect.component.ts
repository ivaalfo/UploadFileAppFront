/*import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { MultiselectOption } from '@shared/components/multiselect/multiselect.component';
import { Store } from '@data/shared/store';
import { MasterTablesService } from '@core/services/api/master-tables/master-tables.service';
import { sortArrayBy } from '@shared/utils/array-utils';

@Component({
  selector: 'm-stores-multiselect',
  templateUrl: './stores-multiselect.component.html'
})
export class StoresMultiselectComponent implements OnInit {

  @Input()
  public id!: string;

  @Input()
  public emptyStore = false;

  @Input()
  public selectedStores!: string[];

  @Input()
  public disabled!: boolean;

  @Output()
  public storesChanged = new EventEmitter<string[]>();

  public stores!: MultiselectOption[];
  public allStores!: MultiselectOption[];

  public constructor(
    private readonly masterTablesService: MasterTablesService
  ) { }

  public ngOnInit(): void {
    this.getStores();
  }

  public getStores(): void {
    this.masterTablesService.getStores()
      .subscribe((stores: any) => {
        this.allStores = stores;
        this.stores = (!this.emptyStore ? stores.filter((s: Store) => s.codigo !== '0') : stores)
          .map((s: any) => ({
            code: s.codigo,
            description: s.descripcion
          }));

        this.stores = this.sortedByCodes(this.stores);
      });
  }

  public onStoresChange(values: string[]): void {
    this.storesChanged.emit(values);
  }

  private sortedByCodes(stores: MultiselectOption[]): MultiselectOption[] {
    return  stores.sort(sortArrayBy('code'));
  }
}
*/