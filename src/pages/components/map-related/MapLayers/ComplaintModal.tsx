import z from 'zod'
import { useState, ChangeEvent } from 'react'
import {
  Button,
  MenuItem,
  TextField,
  CircularProgress,
  DialogTitle,
  DialogContent,
  Dialog,
  DialogActions,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Point } from 'src/pages/timeBasedMap'
import { getSiriRideWithRelated } from 'src/api/siriService'

const complaintTypes = [
  'other',
  'no_stop',
  'no_ride',
  'delay',
  'overcrowded',
  'driver_behavior',
  'early',
  'cleanliness',
  'fine_appeal',
  'route_change',
  'line_switch',
  'station_signs',
] as const

const dataVerificationSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  id: z.string().min(9),
  email: z.string().email(),
  phone: z.string().regex(/05[0-9]{8}/),
  complaintType: z.enum(complaintTypes),
  description: z.string().min(30),
})

type dataVerificationType = z.infer<typeof dataVerificationSchema>

interface ComplaintModalProps {
  modalOpen: boolean
  setModalOpen: (open: boolean) => void

  position: Point
}

const ComplaintModal = ({ modalOpen, setModalOpen, position }: ComplaintModalProps) => {
  const { t, i18n } = useTranslation()
  const [complaintData, setComplaintData] = useState<Partial<dataVerificationType>>(
    dataVerificationSchema.parse({}),
  )

  const siriRideQuery = useQuery({
    queryKey: ['siriRide', position] as const,
    queryFn: ({ queryKey: [, position] }) =>
      getSiriRideWithRelated(
        position.point!.siri_route__id.toString(),
        position.point!.siri_ride__vehicle_ref.toString(),
        position.point!.siri_route__line_ref.toString(),
      ),
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setComplaintData((prevData) => ({ ...prevData, [name]: value }))
  }

  if (siriRideQuery.isLoading)
    return (
      <div className="loading">
        <span>{t('loading_routes')}</span>
        <CircularProgress />
      </div>
    )

  // TODO : Error handling
  if (!siriRideQuery.data) return <h1>Error</h1>

  return (
    <Dialog
      dir={i18n.dir()}
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: () => undefined, // TODO : handling submit
        },
      }}>
      <DialogTitle>{t('complaint')}</DialogTitle>
      <DialogContent>
        <TextField
          label={t('first_name')}
          name="firstName"
          value={complaintData.firstName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t('last_name')}
          name="lastName"
          value={complaintData.lastName}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t('id')}
          name="id"
          value={complaintData.id}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t('email')}
          name="email"
          type="email"
          value={complaintData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label={t('phone')}
          name="phone"
          type="tel"
          value={complaintData.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          id="complaint_type"
          select
          margin="normal"
          label={t('complaint_type')}
          fullWidth
          name="complaintType"
          value={complaintData.complaintType}
          onChange={handleChange}>
          {complaintTypes.map((option) => (
            <MenuItem key={option} value={option}>
              {t(option)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label={t('description')}
          name="description"
          type="text"
          value={complaintData.description}
          onChange={handleChange}
          multiline
          rows={4}
          fullWidth
          margin="normal"
        />
        <DialogActions sx={{ gap: '5px', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="warning" onClick={() => setModalOpen(false)}>
            {t('close_complaint')}
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {t('submit_complaint')}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}

export default ComplaintModal
