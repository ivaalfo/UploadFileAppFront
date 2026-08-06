//import { Moment } from 'moment';
//import { DATE_FORMAT } from '@core/services/api/api.constants';

//NEXT FILTRO
//NO SE USA TODAVIA
export class PageFilter {
  public readonly page!: string;
  public readonly filters: Filters = new Filters();

  public constructor(page: string, 
    //stores?: string[], 
    //startDate?: Moment, endDate?: Moment, 
    //shippers?: string[],
    //storePoints?: string[],

    pendingOrders?: string[]

  ) {
      this.page = page;
      this.filters = new Filters(/*stores, startDate, endDate, shippers, storePoints,*/ pendingOrders);
    }
}

export class Filters {
  //public readonly stores!: string;
  //public readonly startDate!: string;
  //public readonly endDate!: string;
  //public readonly shippers!: string;
  //public readonly storePoints!: string;

  public readonly pendingOrders!: string;

  public constructor(
    //stores?: string[], 
    //startDate?: Moment, endDate?: Moment, 
    //shippers?: string[], 
    //storePoints?: string[],
    pendingOrders?: string[]
  ) {

    /*
    this.stores = (stores) ? stores.join(',') : '';
    if (startDate && endDate) {
      this.startDate = startDate.format(DATE_FORMAT);
      this.endDate = endDate.format(DATE_FORMAT);
    }
    this.shippers = (shippers) ? shippers.join(',') : '';
    this.storePoints = (storePoints) ? storePoints.join(',') : '';
    */
    this.pendingOrders = (pendingOrders) ? pendingOrders.join(',') : '';
  }
}

export enum Pages {
  /*
  ARRIVALS = 'ARRIVALS',
  SCHEDULED = 'SCHEDULED',
  PENDING = 'PENDING',
  RETURNS = 'RETURNS',
  ARTICLE = 'ARTICLE',
  CONTAINER = 'CONTAINER',
  ALERT_CENTER = 'ALERT_CENTER',
  DRIVERS = 'DRIVERS',
  DOCKS = 'DOCKS',
  */

  PEDIDOS_PEND = 'PEDIDOS_PEND'
}
