import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-event-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './event-dialog.component.html',
  styleUrl: './event-dialog.component.css'
})
export class EventDialogComponent {
  title = '';
  description = '';
  startTime = '';
  endTime = '';
  selectedVenueIds: number[] = [];
  occupiedVenueIds: number[] = [];
  
  mode: 'add' | 'edit' = 'add';
  venues: any[] = [];
  timeSlots: any[] = [];
  getOccupiedVenues?: (startTime: string, endTime: string) => number[];

  constructor(
    public dialogRef: MatDialogRef<EventDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog
  ) {
    this.mode = data.mode;
    this.venues = data.venues;
    this.timeSlots = data.timeSlots;
    this.getOccupiedVenues = data.getOccupiedVenues;

    if (this.mode === 'add') {
      this.selectedVenueIds = [data.defaultVenueId];
      this.startTime = data.defaultStartTime;
      this.endTime = data.defaultEndTime || this.startTime;
    } else {
      // Edit mode
      const event = data.event;
      this.title = event.title;
      this.description = event.description;
      this.startTime = event.startTime;
      this.endTime = event.endTime;
      this.selectedVenueIds = [...event.venueIds];
    }
    
    // Calculate initially occupied venues
    this.updateOccupiedVenues();
  }

  updateOccupiedVenues() {
    if (this.getOccupiedVenues && this.startTime && this.endTime) {
      this.occupiedVenueIds = this.getOccupiedVenues(this.startTime, this.endTime);
    }
  }

  onTimeChange() {
    this.updateOccupiedVenues();
    // Remove any selected venues that are now occupied
    this.selectedVenueIds = this.selectedVenueIds.filter(id => !this.occupiedVenueIds.includes(id));
  }

  onSave() {
    if (!this.title || !this.startTime || !this.endTime || this.selectedVenueIds.length === 0) {
      alert('Please fill all required fields');
      return;
    }

    if (this.startTime >= this.endTime) {
      alert('End time must be after start time');
      return;
    }

    this.dialogRef.close({
      action: 'save',
      title: this.title,
      description: this.description,
      startTime: this.startTime,
      endTime: this.endTime,
      venueIds: this.selectedVenueIds.sort((a, b) => a - b)
    });
  }

  onDelete() {
    const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        title: 'Delete Event',
        message: 'Are you sure you want to delete this event? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    confirmDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close({ action: 'delete' });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  toggleVenue(venueId: number) {
    // Don't allow toggling occupied venues
    if (this.isVenueOccupied(venueId)) return;
    
    const index = this.selectedVenueIds.indexOf(venueId);
    if (index > -1) {
      this.selectedVenueIds.splice(index, 1);
    } else {
      this.selectedVenueIds.push(venueId);
    }
  }

  isVenueSelected(venueId: number): boolean {
    return this.selectedVenueIds.includes(venueId);
  }

  isVenueOccupied(venueId: number): boolean {
    return this.occupiedVenueIds.includes(venueId);
  }

  isVenueDisabled(venueId: number): boolean {
    return this.isVenueOccupied(venueId);
  }
}
