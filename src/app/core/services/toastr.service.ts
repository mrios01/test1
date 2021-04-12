import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
	providedIn: 'root'
})

export class ToasterService {

	constructor( private toastr: ToastrService ) { }

	showToast(toastType = 'success', mainText = 'Operation Succeeded!', subText = '', config = {}) {
		this.toastr[toastType](subText, mainText, config);
	}

}
