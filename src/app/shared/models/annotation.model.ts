import { Annotation } from './../enums/annotation.enum';

export interface IAnnotation {
	id: string,
	name: string,
	type: Annotation.LINESTRING | Annotation.POLYGON | Annotation.POINT,
	center: [number],
	bbox?: [[number]]
	features?: []
	lineSrtingPath?: [[number]]
}