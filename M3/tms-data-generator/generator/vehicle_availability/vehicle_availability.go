package vehicle_availability

import (
	"fmt"
	"math/rand"
	"strings"
	"time"
	"tms-data-generator/generator/config"
	"tms-data-generator/generator/vehicles"

	"github.com/brianvoe/gofakeit/v6"
)

// LOGIKA GENEROWANIA DLA vehicle_availability:
// Dla każdego pojazdu generujemy {config.AVAILABILITY_DAYS} dni
// ~85% dni: AVAILABLE (cały dzień)
// ~10% dni: MAINTENANCE (zaplanowany przegląd)
// ~5% dni: REPAIR lub OUT_OF_SERVICE

func GenerateVehicleAvailability(vehicles []vehicles.Vehicle) []VehicleAvailability {
	vehicleAvailabilities := make([]VehicleAvailability, 0, len(vehicles)*config.AVAILABILITY_DAYS)

	idCounter := 1
	for _, vehicle := range vehicles {
		for i := 0; i < config.AVAILABILITY_DAYS; i++ {
			var status VehicleAvailabilityStatus
			r := rand.Float64()
			switch {
			case r < 0.85:
				status = Available
			case r < 0.95:
				status = Maintenance
			default:
				if rand.Intn(2) == 0 {
					status = Repair
				} else {
					status = OutOfService
				}
			}
			// Ustawiamy cały dzień (00:00-23:59:59) - zgodnie z komentarzem dla AVAILABLE
			availabilityFrom := time.Now().AddDate(0, 0, i).Truncate(24 * time.Hour)
			availabilityTo := availabilityFrom.Add(24*time.Hour - time.Second)

			vehicleAvailabilities = append(vehicleAvailabilities, VehicleAvailability{
				ID:               idCounter,
				VehicleID:        vehicle.ID,
				Date:             availabilityFrom,
				AvailabilityFrom: availabilityFrom,
				AvailabilityTo:   availabilityTo,
				Status:           status,
				Notes:            gofakeit.LoremIpsumWord(),
			})
			idCounter++
		}
	}
	return vehicleAvailabilities
}

func GenerateInsertStatements(vehicleAvailabilities []VehicleAvailability) string {
	if len(vehicleAvailabilities) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.Grow(len(vehicleAvailabilities) * 150) // Estimate and pre-allocate memory
	sb.WriteString("INSERT INTO vehicle_availability (id, vehicle_id, date, availability_from, availability_to, status, notes) VALUES\n")

	for i, va := range vehicleAvailabilities {
		// Format date as 'YYYY-MM-DD'
		dateStr := va.Date.Format("2006-01-02")
		// Format time as 'HH:MM:SS'
		timeFromStr := va.AvailabilityFrom.Format("15:04:05")
		timeToStr := va.AvailabilityTo.Format("15:04:05")

		sb.WriteString(fmt.Sprintf("(%d, %d, '%s', '%s', '%s', '%s', '%s')",
			va.ID,
			va.VehicleID,
			dateStr,
			timeFromStr,
			timeToStr,
			va.Status,
			strings.ReplaceAll(va.Notes, "'", "''")))
		if i < len(vehicleAvailabilities)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString(";\n")
		}
	}

	return sb.String()
}
