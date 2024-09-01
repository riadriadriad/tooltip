import { Component, OnInit } from '@angular/core';
import { AfterViewInit, TemplateRef, ViewChild } from "@angular/core";
import { IgxArcGISOnlineMapImagery, IgxGeographicMapComponent, IgxGeographicMapModule, IgxGeographicPolylineSeriesComponent } from "igniteui-angular-maps";
import { IgxShapeDataSource } from "igniteui-angular-core";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IgxDataChartInteractivityModule } from 'igniteui-angular-charts';
import { EsriStyle, EsriUtility } from './EsriUtility';
import { MatInputModule } from '@angular/material/input'; 


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IgxGeographicMapModule,
    IgxDataChartInteractivityModule,
    MatInputModule,
    
    
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements AfterViewInit,OnInit{
  displayedColumns: string[] = ['id', 'name', 'age', 'email'];
  @ViewChild("map", { static: true })
    public map: IgxGeographicMapComponent;
    @ViewChild("template", { static: true })
    public tooltipTemplate: TemplateRef<object>;
    public geoLocations;
    public geoPolylines: any[] = [];
    private animationFrame: number;
    ngOnInit(): void {
   
    }
    public onDataLoaded(sds: IgxShapeDataSource, e: any) {
      const shapeRecords = sds.getPointData();
      const tileSource = new IgxArcGISOnlineMapImagery();
      tileSource.mapServerUri = EsriUtility.getUri(EsriStyle.WorldTopographicMap);
      this.map.backgroundContent=tileSource
      for (const record of shapeRecords) {
          const route = {
              capacity: record.fieldValues.CapacityG,
              distance: record.fieldValues.DistanceKM,
              name: record.fieldValues.Name,
              points: record.points
          };
          this.geoPolylines.push(route);
      }

      const geoSeries = new IgxGeographicPolylineSeriesComponent();
      geoSeries.dataSource = this.geoPolylines;
      geoSeries.shapeMemberPath = "points";
      geoSeries.shapeFilterResolution = 0.0;
      geoSeries.shapeStrokeThickness = 3;
      geoSeries.shapeStroke = "rgb(82, 82, 82, 0.4)";
      geoSeries.tooltipTemplate = this.tooltipTemplate;

      this.map.series.add(geoSeries);
  }
  
    constructor() {
    }

    public ngAfterViewInit(): void {
      const tileSource = new IgxArcGISOnlineMapImagery();
      tileSource.mapServerUri = EsriUtility.getUri(EsriStyle.WorldTopographicMap);
      const sds = new IgxShapeDataSource();
      sds.importCompleted.subscribe(() => this.onDataLoaded(sds, ""));
      sds.shapefileSource = "https://static.infragistics.com/xplatform/shapes/WorldCableRoutes.shp";
      sds.databaseSource  = "https://static.infragistics.com/xplatform/shapes/WorldCableRoutes.dbf";
      sds.dataBind();
      this.map.backgroundContent = tileSource;


    }
    public onSearchCable(event:Event): void {
      const inputElement = event.target as HTMLInputElement;
      const cableName = inputElement.value.trim();
  
      const cable = this.geoPolylines.find(c => c.name.toLowerCase() == cableName.toLowerCase());
      if (cable) {
        this.zoomToPoints(cable.points);
      } else {
        console.warn('Cable not found');
      }
    }
    getBoundingBox(points: { x: number, y: number }[][]): { xmin: number, ymin: number, xmax: number, ymax: number } {
      let xmin = Number.POSITIVE_INFINITY;
      let ymin = Number.POSITIVE_INFINITY;
      let xmax = Number.NEGATIVE_INFINITY;
      let ymax = Number.NEGATIVE_INFINITY;
  
      points.forEach(polyline => {
        polyline.forEach(point => {
          if (point.x < xmin) xmin = point.x;
          if (point.y < ymin) ymin = point.y;
          if (point.x > xmax) xmax = point.x;
          if (point.y > ymax) ymax = point.y;
        });
      });
  
      return { xmin, ymin, xmax, ymax };
    }
  
    zoomToPoints(points: { x: number, y: number }[][]) {
      const { xmin, ymin, xmax, ymax } = this.getBoundingBox(points);
  
      const rect = {left:xmin, top:ymin, width:xmax - xmin, height:ymax - ymin};
      this.map.zoomToGeographic(rect);
    }
    zoomToPointsAnimated(points: { x: number, y: number }[][]) {
      const { xmin, ymin, xmax, ymax } = this.getBoundingBox(points);
      const targetRect = {left:xmin, top:ymin, width:xmax - xmin, height:ymax - ymin};
  
      const startRect = this.map.windowRect;
      const animationDuration = 2000; // Duration of the animation in milliseconds
      const startTime = performance.now();
  
      const animateZoom = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);
  
        const left = startRect.left + (targetRect.left - startRect.left) * progress;
        const top = startRect.top + (targetRect.top - startRect.top) * progress;
        const width = startRect.width + (targetRect.width - startRect.width) * progress;
        const height = startRect.height + (targetRect.height - startRect.height) * progress;
  
        this.map.windowRect = {left:left, top:top, width:width, height:height};
  
        if (progress < 1) {
          this.animationFrame = requestAnimationFrame(animateZoom);
        }
      };
  
      this.animationFrame = requestAnimationFrame(animateZoom);
    }
  
  }
  
    /*
    private loadGeoJsonData(sds:any,e:any): void {
      // Fetch the GeoJSON file
      fetch('assets/ma.json')
      .then(response=>response.json())
        .then(data => {
          const shapeRecords = data.getPointData();
          const geoPolylines: any[] = [];
          for (const record of shapeRecords) {

              // using field/column names from .DBF file
              const route = {
                  capacity: record.fieldValues.CapacityG,
                  distance: record.fieldValues.DistanceKM,
                  name: record.fieldValues.Name,
                  points: record.points
              };
              geoPolylines.push(route);
          }
          const geoSeries = new IgxGeographicShapeSeriesComponent();
          const tileSeries = new IgxGeographicTileSeriesComponent();
          tileSeries.dataSource = "https://a.tile.opentopomap.org/{z}/{x}/{y}.png";
      
          geoSeries.dataSource = data;
          geoSeries.shapeMemberPath = 'geometry';
          geoSeries.dataSource = geoPolylines;
          geoSeries.shapeMemberPath = "points";
          geoSeries.shapeFilterResolution = 0.0;
          geoSeries.shapeStrokeThickness = 3;
          geoSeries.shapeStroke = "rgb(82, 82, 82, 0.4)";
          geoSeries.tooltipTemplate = this.tooltipTemplate;    const osmImagery = new IgxOpenStreetMapImagery();
    this.map.backgroundContent = osmImagery;
          this.map.series.add(geoSeries);
          this.map.series.add(tileSeries);

        });
    }*/

