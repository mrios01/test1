import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/* Mapbox */
import mapboxgl from 'mapbox-gl';
/* Store */
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.state';
/* Rxjs */
import { Observable, Subject } from 'rxjs';
/* Services */
import { ToasterService } from './toastr.service';
import { HttpService } from './http.service';
/* Enums */
import { Annotation } from './../../shared/enums/annotation.enum';
/* Models */
import MapProps from '../../shared/models/mapProps.model';
import { IAnnotation } from './../../shared/models/annotation.model';
/* Actions */
import { ADD_ANNOTATION, REMOVE_ANNOTATION } from '../../state/annotations.actions';

@Injectable({
	providedIn: 'root'
})

export class MapBoxService {

	currLocationUpdated = new Subject<any>();
	activeAnnotUpdated = new Subject<any>();
	annotations$: Observable<IAnnotation[]>;
	defaultCoordinates = [34.855499, 32.109333]; // TEL-AVIV
	currLocationData;
	state;
	map;

	constructor(
		private store: Store<AppState>,
		private toastService: ToasterService,
		private httpService: HttpService
	) {

		mapboxgl.accessToken = environment.ACCESS_TOKEN;

		this.store.select(state => state).subscribe(data => {
			this.state = data;
		});
	}

	getAnnotationProps(type) {

		if(type == Annotation.POINT){
			return this.state.Annotations.map(annot => {
				if(annot.type != type) return {};

        console.log("getAnnotationProps Point state ");
        console.log(this.state);

				return {
					'type': 'Feature',
					'geometry': { 'type': type,
						'coordinates': annot?.center || []
					},
					'properties': { 'title': '' }
				}
			});
		}

		if(type == Annotation.POLYGON) {
			const polygonRes = this.state.Annotations.filter( annot => annot.type == type );

        console.log("getAnnotationProps Polygon state ");
        console.log(this.state);
        console.log("Polygon Res ");
        console.log(this.state.Annotations.filter( annot => annot.type == type ));


			return [...polygonRes?.[0]?.features];
		}

		if(type == Annotation.LINESTRING) {
			const linestringRes = this.state.Annotations.filter( annot => annot.type == type );

        console.log("getAnnotationProps Linestring state ");
        console.log(this.state);

			return {
				'type': 'geojson',
				'data': {
					'type': 'Feature',
					'properties': {},
					'geometry': {
						'type': type,
						'coordinates': linestringRes?.[0]?.lineSrtingPath || []
					}
				}
			}
		}
	}


	drawMap(mapProps: MapProps) {

		if(!mapProps?.containerID) return;

    console.log("mapProps ");
    console.log(mapProps);

		this.map = new mapboxgl.Map({
			container: mapProps.containerID,
			style: 'mapbox://styles/mapbox/streets-v11',
			center: [
				mapProps?.lat || this.defaultCoordinates[0],
				mapProps?.lang || this.defaultCoordinates[1]
			],
			zoom: 12
		});
	}

	drawPolygon(action = null) {

		if(!this.canAddAnnotation('Polygon')) return this.toastService.showToast(
			'warning', 'Be Aware!',
			!Object.values(this.currLocationData || []).length ? 'Must Choose Location First!' : 'Polygon Annotation Already Exist!'
		);

		this.httpService.fetchPolygoneArea(this.currLocationData).subscribe((res: any) => {

			try {

				if (this.map.getLayer('polygonLayer')) this.map.removeLayer('polygonLayer');
				if (this.map.getSource('iso')) this.map.removeSource('iso');

				if(action != 'repaint') {
					this.store.dispatch({
						type: ADD_ANNOTATION,
						payload: <IAnnotation> {
							id: 'polygonLayer',
							name: `${Annotation.POLYGON} - [${this.currLocationData.center}]`,
							type: Annotation.POLYGON,
							center: this.currLocationData.center,
							bbox: this.currLocationData.bbox,
							features: res.features,
						}
					});
				}

				this.map.addSource('iso', {
					type: 'geojson',
					data: {
					  "type": 'FeatureCollection',
					  "features":  this.getAnnotationProps(Annotation.POLYGON)
					}
				});

				this.map.addLayer({
					'id': 'polygonLayer',
					'type': 'fill',
					'source': 'iso',
					'layout': {},
					'paint': {
					  'fill-color': '#000',
					  'fill-opacity': 0.7
					}
				  }, "poi-label");

				this.map.on('click', 'polygonLayer', (e) => {
					const layerID = e?.features?.[0]?.layer.id;

					if(layerID) this.activeAnnotUpdated.next(layerID);
				});

			} catch (error) {
				if(action !='repaint') this.toastService.showToast('error', 'ERROR', 'Failed Adding Polygon!');
			}
		});

		this.zoomMapOnLocation(this.currLocationData.center);
	}

	drawLinestring(action = null) {

		if(!this.canAddAnnotation('LineString')) return this.toastService.showToast(
			'warning', 'Be Aware!',
			!Object.values(this.currLocationData || []).length ? 'Must Choose Location First!' : 'LineString Annotation Already Exist!'
		);

		this.httpService.fetchLinestringArea(this.currLocationData).subscribe((res: any) => {

			try {

				if (this.map.getLayer('lineStringLayer')) this.map.removeLayer('lineStringLayer');
				if (this.map.getSource('route')) this.map.removeSource('route');

				if(action != 'repaint' ||!this.state.Annotation.some((annot) => annot.id == 'lineStringLayer')) {
					this.store.dispatch({
						type: ADD_ANNOTATION,
						payload: <IAnnotation> {
							id: 'lineStringLayer',
							name: `${Annotation.LINESTRING} - [${this.currLocationData.center}]`,
							type: Annotation.LINESTRING,
							center: this.currLocationData.center,
							bbox: this.currLocationData.bbox,
							lineSrtingPath: [...res.routes[0].geometry.coordinates],
						}
					});
				}

				this.map.addSource('route', this.getAnnotationProps(Annotation.LINESTRING));

				this.map.addLayer({
					'id': 'lineStringLayer',
					'type': 'line',
					'source': 'route',
					'layout': {
						'line-join': 'round',
						'line-cap': 'round'
					},
					'paint': {
						'line-color': '#888',
						'line-width': 8
					}
				});

				this.map.on('click', 'lineStringLayer', (e) => {
					const layerID = e?.features?.[0]?.layer.id;

					if(layerID) this.activeAnnotUpdated.next(layerID);
				});

				this.zoomMapOnLocation(this.currLocationData.center);

			} catch (error) {
				if(action !='repaint') this.toastService.showToast('error', 'ERROR', 'Failed Adding Linestring!');
			}
		});
	}

	drawPoint(action = null) {

		if(!this.canAddAnnotation('Point')) return this.toastService.showToast(
			'warning', 'Be Aware!',
			!Object.values(this.currLocationData || []).length ? 'Must Choose Location First!' : 'Point Annotation Already Exist!'
		);

		try {

			const LAYER_UNIQUE_ID = `${this.currLocationData.id}-${Annotation.POINT}`;

			if(action != 'repaint'){
				this.store.dispatch({
					type: ADD_ANNOTATION,
					payload: <IAnnotation> {
						id: LAYER_UNIQUE_ID,
						name: `${Annotation.POINT} - [${this.currLocationData.center}]`,
						type: Annotation.POINT,
						center: this.currLocationData.center,
					}
				});
			}

			if(this.map.getSource('pointsSource')) {
				return this.map.getSource('pointsSource')
					.setData({
						'type': 'FeatureCollection',
						'features': this.getAnnotationProps(Annotation.POINT)
					});
			}

			this.map.addSource('pointsSource', {
				'type': 'geojson',
				'data': {
					'type': 'FeatureCollection',
					'features': this.getAnnotationProps(Annotation.POINT)
				}
			});

			this.map.addLayer({
				'id': LAYER_UNIQUE_ID,
				'type': 'circle',
				'source': 'pointsSource',
				'paint': {
					'circle-radius': 20,
					'circle-color': '#007cbf'
				}
			});

			this.map.on('click', LAYER_UNIQUE_ID, (e) => {
				const layerID = e?.features?.[0]?.layer.id;

				if(layerID) this.activeAnnotUpdated.next(layerID);
			});

			this.zoomMapOnLocation(this.currLocationData.center);

		} catch (error) {
			this.toastService.showToast('error', 'ERROR', 'Failed Adding Point!');
		}
	}

	zoomMapOnLocation(coordinates = null) {

		if(!this.map) return;

		this.map.flyTo({ center: coordinates || this.defaultCoordinates });
	}

	canAddAnnotation(type) {

		if(!this.map || !this.currLocationData) return false;

		return !this.state.Annotations.some((annot) => { return annot.id == `${this.currLocationData.id}-${type}`});
	}



}
