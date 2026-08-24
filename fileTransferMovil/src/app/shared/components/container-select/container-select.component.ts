import { Component, Input, Output, EventEmitter,  } from '@angular/core';
import { Container } from 'src/app/data/container/container';

@Component({
  selector: 'm-container-select',
  templateUrl: './container-select.component.html',
  styleUrls: ['./container-select.component.scss']
})
export class ContainerSelectComponent  {
  @Input()
  public options: Container[];

  @Input()
  public placeholder: string;

  @Input()
  public selectedValue: string;

  @Output()
  public valueSelected: EventEmitter<Container> = new EventEmitter<Container>();
  public gasesEstadoCod: string[] = [];
  public containerName: string;

  public ngOnInit(): void {
    for (let i = 0; i < this.options.length; ++i) {
      if (this.options[i].gasesEstadoCod === 'NOK') {
        this.gasesEstadoCod.push('NOK');
        this.options[i].contenedor = this.options[i].contenedor.toString() + ' - NOT_OK';
      } else {
        this.gasesEstadoCod.push('OK');
        this.options[i].contenedor = this.options[i].contenedor.toString() + ' - OK';
      }
    }
  }

  public onChange(value: string): void {
    const valueJ = JSON.parse(value);
    this.valueSelected.emit(valueJ);
  }

  public isSelected(value: string): boolean {
    return value === this.selectedValue;
  }

  public toStr(value: Container) {
    for (let i = 0; i < this.options.length; ++i) {
      if (value.contenedor === this.options[i].contenedor) {
        this.containerName = value.contenedor;
        if (value.contenedor.length == 11) {
          if (value.gasesEstadoCod === 'NOK') {
            this.containerName = value.contenedor.toString() + ' - NOT_OK';
          } else {
            this.containerName = value.contenedor.toString() + ' - OK';
          }
        }
      }
    }
    value.contenedor = this.containerName;
    return JSON.stringify(value);
  }

}
