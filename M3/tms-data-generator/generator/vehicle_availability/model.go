package vehicle_availability

import (
	"time"
)

// VehicleAvailabilityStatus represents the status of a vehicle availability.
type VehicleAvailabilityStatus string

// VehicleAvailabilityStatus values
const (
	Available    VehicleAvailabilityStatus = "AVAILABLE"
	Maintenance  VehicleAvailabilityStatus = "MAINTENANCE"
	Repair       VehicleAvailabilityStatus = "REPAIR"
	Reserved     VehicleAvailabilityStatus = "RESERVED"
	OutOfService VehicleAvailabilityStatus = "OUT_OF_SERVICE"
)

// VehicleAvailability represents a vehicle availability entity.
type VehicleAvailability struct {
	ID               int
	VehicleID        int
	Date             time.Time
	AvailabilityFrom time.Time
	AvailabilityTo   time.Time
	Status           VehicleAvailabilityStatus
	Notes            string
}
