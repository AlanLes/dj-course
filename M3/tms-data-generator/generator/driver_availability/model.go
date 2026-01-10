package driver_availability

import (
	"time"
)

// DriverAvailabilityStatus represents the status of a driver availability.
type DriverAvailabilityStatus string

// DriverAvailabilityStatus values
const (
	Scheduled DriverAvailabilityStatus = "SCHEDULED"
	Available DriverAvailabilityStatus = "AVAILABLE"
	OnLeave   DriverAvailabilityStatus = "ON_LEAVE"
	Training  DriverAvailabilityStatus = "TRAINING"
)

type DriverAvailability struct {
	ID         int
	DriverID   int
	Date       time.Time // Use time.Time for the Date field, as time.DateOnly does not exist in the standard Go time package.
	ShiftStart time.Time
	ShiftEnd   time.Time
	Status     DriverAvailabilityStatus
	Notes      string
}
