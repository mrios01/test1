import { Component, ViewChild, OnInit, AfterViewInit } from "@angular/core";

/* Services */
import { MapBoxService } from "../../core/services/mapBox.service";
/* Models */
import MapProps from "../../shared/models/mapProps.model";

@Component({
  selector: "app-map-view",
  templateUrl: "./map-view.component.html",
  styleUrls: ["./map-view.component.scss"]
})
export class MapViewComponent implements OnInit, AfterViewInit {
  @ViewChild("map") mapElem;

  constructor(private mapBoxService: MapBoxService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    let mapOptions: MapProps = {
      containerID: this.mapElem.nativeElement.id,
      lat: 34.855499,
      lang: 32.109333
    };
    this.mapBoxService.drawMap(mapOptions);
  }
}
