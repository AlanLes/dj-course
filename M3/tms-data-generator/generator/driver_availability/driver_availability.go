package driver_availability

import (
	"fmt"
	"math/rand"
	"strings"
	"time"
	"tms-data-generator/generator/config"
	"tms-data-generator/generator/drivers"

	"github.com/brianvoe/gofakeit/v6"
)

// LOGIKA GENEROWANIA DLA driver_availability:
// Dla każdego kierowcy generujemy {config.AVAILABILITY_DAYS} dni
// Dni robocze (pn-pt): status SCHEDULED lub AVAILABLE, losowe zmiany (6-14, 14-22, 22-6)
// Weekendy: status ON_LEAVE lub SCHEDULED (mniej prawdopodobne)
// Losowo ~5% dni: ON_LEAVE lub TRAINING

func GenerateDriverAvailability(drivers []drivers.Driver) []DriverAvailability {
	driverAvailabilities := make([]DriverAvailability, 0, len(drivers)*config.AVAILABILITY_DAYS)

	idCounter := 1
	// Start od dzisiaj i generuj kolejne dni
	for _, driver := range drivers {
		for i := 0; i < config.AVAILABILITY_DAYS; i++ {
			// Ustal datę dnia i dzień tygodnia
			date := time.Now().AddDate(0, 0, i).Truncate(24 * time.Hour)
			weekday := date.Weekday()
			var status DriverAvailabilityStatus

			// 5% losowa szansa na ON_LEAVE lub TRAINING, niezależnie od dnia tygodnia
			r := rand.Float64()
			if r < 0.05 {
				if rand.Intn(2) == 0 {
					status = OnLeave
				} else {
					status = Training
				}
			} else {
				if weekday >= time.Monday && weekday <= time.Friday {
					// Dni robocze pn-pt: SCHEDULED (80%) lub AVAILABLE (20%)
					if rand.Float64() < 0.8 {
						status = Scheduled
					} else {
						status = Available
					}
				} else {
					// Weekend: ON_LEAVE (70%) lub SCHEDULED (30%)
					if rand.Float64() < 0.7 {
						status = OnLeave
					} else {
						status = Scheduled
					}
				}
			}

			// Losowy wybór zmiany: 6-14, 14-22, 22-6 (kolejnego dnia)
			shifts := []struct {
				startHour int
				endHour   int
				nextDay   bool
			}{
				{6, 14, false},  // 6:00 - 14:00
				{14, 22, false}, // 14:00 - 22:00
				{22, 6, true},   // 22:00 - 6:00 (kolejnego dnia)
			}
			shift := shifts[rand.Intn(len(shifts))]
			start := time.Date(date.Year(), date.Month(), date.Day(), shift.startHour, 0, 0, 0, date.Location())
			var end time.Time
			if shift.nextDay {
				end = start.Add(8 * time.Hour)
			} else {
				end = time.Date(date.Year(), date.Month(), date.Day(), shift.endHour, 0, 0, 0, date.Location())
			}

			driverAvailabilities = append(driverAvailabilities, DriverAvailability{
				ID:         idCounter,
				DriverID:   driver.ID,
				Date:       date,
				ShiftStart: start,
				ShiftEnd:   end,
				Status:     status,
				Notes:      gofakeit.LoremIpsumWord(),
			})
			idCounter++
		}
	}
	return driverAvailabilities
}

func GenerateInsertStatements(driverAvailabilities []DriverAvailability) string {
	if len(driverAvailabilities) == 0 {
		return ""
	}

	var sb strings.Builder
	sb.Grow(len(driverAvailabilities) * 150) // Estimate and pre-allocate memory
	sb.WriteString("INSERT INTO driver_availability (id, driver_id, date, shift_start, shift_end, status, notes) VALUES\n")

	for i, da := range driverAvailabilities {
		// Format date as YYYY-MM-DD
		dateStr := da.Date.Format("2006-01-02")
		// Format times as HH:MM:SS
		shiftStartStr := da.ShiftStart.Format("15:04:05")
		shiftEndStr := da.ShiftEnd.Format("15:04:05")

		sb.WriteString(fmt.Sprintf("(%d, %d, '%s', '%s', '%s', '%s', '%s')",
			da.ID,
			da.DriverID,
			dateStr,
			shiftStartStr,
			shiftEndStr,
			da.Status,
			strings.ReplaceAll(da.Notes, "'", "''")))
		if i < len(driverAvailabilities)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString(";\n")
		}
	}

	return sb.String()
}
