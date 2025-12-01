import { Component, computed, OnInit, signal } from '@angular/core';
import { Parking } from '../../../services/parking';
import { switchMap } from 'rxjs';
import { ParkingSlot } from '../../../models/parking.model';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-parking-exit',
  imports: [CommonModule],
  templateUrl: './parking-exit.html',
  styleUrl: './parking-exit.css',
})
export class ParkingExit implements OnInit {
  toastMessage = signal<string>('');

  // Show toast for 3 seconds
  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 9000);
  }
  searchTerm = signal<string>('');
  currentPage = signal<number>(1);
  readonly pageSize = 5;
  lastBillInfo = '';
  PARKING_RATE_PER_HOUR = 50
  slots = signal<ParkingSlot[]>([])
  constructor(public parkingService: Parking) { }

  get occupiedSlots() {
    return this.slots().filter(s => s.occupied);
  }
  ngOnInit() {
    this.parkingService.loadSlots().subscribe(
      (res) => this.slots.set(res)
    )
  }
  filteredSlots = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.occupiedSlots;

    return this.occupiedSlots.filter(slot =>
      slot.slotNumber?.toLowerCase().includes(term) ||
      slot.vehicleNumber?.toLowerCase().includes(term)
    );
  });
  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSlots().length / this.pageSize))
  );

  pagedSlots = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredSlots().slice(start, start + this.pageSize);
  });

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }

  calculateBill(entryTime?: string): number {
    if (!entryTime) return this.PARKING_RATE_PER_HOUR; // default 1 hour

    const start = new Date(entryTime).getTime();
    const end = Date.now();
    const diffMs = end - start;

    const hours = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
    return hours * this.PARKING_RATE_PER_HOUR;
  }

  exit(slotId: number) {
    const slot = this.slots().find(s => s.id === slotId);
    if (!slot) return;

    const amount = this.calculateBill(slot.entryTime);

    this.parkingService
      .exitVehicle(slotId)
      .pipe(switchMap(() => this.parkingService.loadSlots()))
      .subscribe(() => {
        this.showToast(
          this.lastBillInfo = `Vehicle ${slot.vehicleNumber
          } exited from ${slot.slotNumber}. Bill Amount: ₹${amount}`)
      });
  }
}
