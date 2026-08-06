import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigurationService } from '@core/services/configuration/configuration.service';
import { map, shareReplay, take } from 'rxjs/operators';
import { MasterTable, MasterTableDto, MasterTablesEnum } from '@data/shared/masterTables';

const CACHE_SIZE = 1;
const MASTER_TABLES = 'api/v1/maestras';

interface MasterTablesCache {
  tabla: string;
  observable$: Observable<MasterTable[]>;
}

@Injectable({
  providedIn: 'root'
})
export class MasterTablesService {

  private masterTablesCache: MasterTablesCache[] = [];

  public constructor(
    public http: HttpClient,
    public config: ConfigurationService,
  ) { }

  //MASTER_TABLE
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
}
