import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ParkingSlot } from '../models/parking.model';
@Injectable({
  providedIn: 'root',
})
export class Parking {
  // Global state using signal
  API_URL = "https://692c3a1cc829d464006ee2c0.mockapi.io/v1/slots"


  constructor(private http: HttpClient) { }

  loadSlots(): Observable<ParkingSlot[]> {
    return this.http.get<ParkingSlot[]>(this.API_URL)
  }

  addVehicle(slotId: number, vehicleNumber: string): Observable<any> {
    const entryTime = new Date().toISOString();
    return this.http.patch(`${this.API_URL}/${slotId}`, {
      occupied: true,
      vehicleNumber,
      entryTime
    });
  }

  exitVehicle(slotId: number): Observable<any> {
    return this.http.patch(`${this.API_URL}/${slotId}`, {
      occupied: false,
      vehicleNumber: '',
      entryTime: ''
    });
  }
}
