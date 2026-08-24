import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay, take, map } from 'rxjs/operators';
import { MasterTable, MasterTablesEnum, MasterTableDto } from '../../../data/shared/masterTables';
import { Store, StoreDto } from 'src/app/data/shared/store';
import { ApiClient } from '../../api-client.service';

const CACHE_SIZE = 1;
const MASTER_TABLES = 'api/v1/maestras';
const STORES_PATH = 'api/v1/almacenes';

interface MasterTablesCache {
  tabla: string;
  observable$: Observable<MasterTable[]>;
}

@Injectable({
  providedIn: 'root'
})
export class MasterTablesService  extends ApiClient {

  private masterTablesCache: MasterTablesCache[] = [];
  private storesCache$: Observable<Store[]> | undefined;

  private getMasterTableFromCache(table: string): Observable<MasterTable[]> | undefined {
    if (this.masterTablesCache) {
      const masterTableCached = this.masterTablesCache.find(masterTable => masterTable.tabla === table);
      if (masterTableCached) {
        return masterTableCached.observable$;
      }
    }
    return undefined;
  }

  public getMasterTable(tabla: MasterTablesEnum, tipo?: number): Observable<MasterTable[]> {
    let masterTable$ = this.getMasterTableFromCache(tabla);
    if (!masterTable$) {
      masterTable$ = this.requestMasterTable(tabla, tipo).pipe(
        shareReplay(CACHE_SIZE)
      );
      const masterTable: MasterTablesCache = {
        tabla,
        observable$: masterTable$
      };
      this.masterTablesCache = [...this.masterTablesCache, masterTable];
    }
    return masterTable$;
  }

  private requestMasterTable(tabla: MasterTablesEnum, tipo?: number): Observable<MasterTable[]> {
    let path = `${this.config.apiBaseUrl}${MASTER_TABLES}/${tabla}`;
    if (tipo) {
      path += `/$${tipo}`;
    }
    return this.http.get<MasterTableDto[]>(path)
      .pipe(
        take(1),
        map(masterTable => masterTable.map(mt => MasterTable.parseDto(mt)))
      );
  }
  public getStores(): Observable<Store[]> {
    if (!this.storesCache$) {
      this.storesCache$ = this.requestStores().pipe(
        shareReplay(CACHE_SIZE)
      );
    }
    return this.storesCache$;
  }

  public removeStoreCache(): void {
    if (this.storesCache$) {
      this.storesCache$ = undefined;
    }
    this.masterTablesCache = [];
  }

  private requestStores() {
    return this.http.get<StoreDto[]>(`${this.config.apiBaseUrl}${STORES_PATH}`)
      .pipe(
        take(1),
        map(stores => stores.map(s => Store.parseDto(s)))
      );
  }
}
