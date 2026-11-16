import { Type, Transform } from "class-transformer";
import {
  IsString,
  IsEmail,
  IsIn,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  ValidateNested,
  Matches,
  IsNumber,
  IsUrl,
  ValidateIf,
} from "class-validator";
import { ApiProperty, PartialType } from "@nestjs/swagger";
const normalizePhone = ({ value }: { value: unknown }) =>
  typeof value === "string"
    ? value.replace(/[() .-]/g, "").replace(/^\+91/, "+91 ")
    : value;
export class LoginDto {
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  email: string;
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @ApiProperty({ required: true, type: String })
  password: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(["customer", "provider", "admin", "arbitrator"])
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  role?: string;
}
export class SignupDto extends LoginDto {
  @IsIn(["customer", "provider"])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  declare role: string;
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name: string;
  @IsString()
  @Matches(/^\+91[ -]?[1-9]\d{9}$/, {
    message:
      "phone must contain +91 and a 10-digit Indian number that does not start with zero",
  })
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Transform(normalizePhone)
  phone: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  businessName?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  serviceArea?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  @ApiProperty({ required: false, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  skills?: string[];
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  addressLine?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  city?: string;
  @ValidateIf((_, value) => value !== undefined)
  @Matches(/^\d{6}$/)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  pincode?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(["Home", "Work", "Other"])
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  addressLabel?: string;
}
export class ProfileDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @Matches(/^\+91[ -]?[1-9]\d{9}$/, {
    message:
      "phone must contain +91 and a 10-digit Indian number that does not start with zero",
  })
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Transform(normalizePhone)
  phone?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsEmail()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toLowerCase() : value,
  )
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  email?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  avatar?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(120)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  location?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(120)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  country?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(120)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  title?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(120)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  department?: string;
}
export class AddressDto {
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  id: string;
  @IsIn(["Home", "Work", "Other"])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  label: string;
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  addressLine: string;
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  city: string;
  @Matches(/^\d{6}$/)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  pincode: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  @ApiProperty({ required: false, type: Boolean })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  isDefault?: boolean;
}
export class AddressesDto {
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  @ApiProperty({ required: true, type: [AddressDto] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  addresses: AddressDto[];
}
export class ProviderDto extends ProfileDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  businessName: string;
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  serviceArea: string;
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @ApiProperty({ required: true, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  skills: string[];
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(200)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  documentName?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  @ApiProperty({ required: false, type: Boolean })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  submit?: boolean;
}
export class ScheduleDto {
  @IsArray()
  @IsIn(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], { each: true })
  @ApiProperty({ required: true, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  days: string[];
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  startTime: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  endTime: string;
  @IsArray()
  @ArrayMaxSize(366)
  @IsString({ each: true })
  @ApiProperty({ required: true, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  blackoutDates: string[];
  @IsInt()
  @Min(0)
  @Max(1440)
  @ApiProperty({ required: true, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  leadMinutes: number = 0;
  @IsInt()
  @Min(0)
  @Max(1440)
  @ApiProperty({ required: true, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  bufferMinutes: number = 0;
  @ValidateIf((_, value) => value !== undefined)
  @IsIn(["Asia/Kolkata"])
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  timeZone?: string;
}
export class ModerationDto {
  @IsIn(["approved", "rejected", "changes_requested", "suspended"])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  status: any;
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  reason: string;
}
export class ListingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  title: string;
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  description: string;
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  categoryId: string;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(20_000_000)
  @ApiProperty({ required: true, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  price: number;
  @IsString()
  @Matches(/^\d+ mins$/)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  duration: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  image?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(40)
  @ApiProperty({ required: false, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  inclusions?: string[];
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(40)
  @ApiProperty({ required: false, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  exclusions?: string[];
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(3000)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  policy?: string;
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(48)
  @ApiProperty({ required: true, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  availableSlots: string[];
  @IsIn(["draft", "published", "paused", "archived"])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  status: any;
}
export class ListingPatchDto extends PartialType(ListingDto, { skipNullProperties: false }) {}
export class BookingDto {
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  serviceId: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  scheduledDate: string;
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  scheduledSlot: string;
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  address: string;
  @IsIn([
    "UPI (Mock Pay)",
    "Card (Mock Pay)",
    "Cash After Service",
    "Other Payment Method",
  ])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  paymentMethod: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsNumber()
  @ApiProperty({ required: false, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  amount?: number;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(2000)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  notes?: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  requestKey?: string;
}
export class NoteDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(2000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  note: string = "";
}
export class ProposalDto {
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  date: string;
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  slot: string;
}
export class ProposalResponseDto {
  @IsBoolean()
  @ApiProperty({ required: true, type: Boolean })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  accept: boolean;
}
export class ReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ required: true, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  rating: number;
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  comment: string;
}
export class ReplyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  reply: string;
}
export class TicketDto {
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  bookingId: string;
  @IsIn([
    "Service Quality Issue",
    "Late Technician Arrival",
    "Damage / Spill Claim",
    "Incorrect Billing",
    "Other",
  ])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  issueType: string;
  @IsIn(["Low", "Medium", "High"])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  severity: string;
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  description: string;
}
export class ResolutionDto {
  @IsIn([
    "Full Mock Refund Issued",
    "Partial Refund (50%)",
    "Redo Service Requested",
    "Formal Warning Issued to Provider",
    "Escalated to Arbitration",
  ])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  outcome: string;
}
export class DisputeDto {
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  bookingId: string;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(20_000_000)
  @ApiProperty({ required: true, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  claimAmount: number;
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  customerStatement: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @ApiProperty({ required: true, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  fileIds: string[] = [];
}
export class ResponseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  statement: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  @ApiProperty({ required: true, type: [String] })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  fileIds: string[] = [];
}
export class AssignmentDto {
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  arbitratorId: string;
}
export class HearingDto {
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  scheduledDate: string;
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  scheduledTime: string;
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  meetUrl: string;
}
export class RulingDto {
  @IsIn([
    "In Favor of Customer",
    "In favour of Customer",
    "In Favor of Provider",
    "In favour of Provider",
    "Mutual Settlement / Split",
  ])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  verdict: string;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(20_000_000)
  @ApiProperty({ required: true, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  awardAmount: number;
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  reason: string;
}
export class ApplicationDto extends LoginDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name: string;
  @IsString()
  @MaxLength(30)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Transform(normalizePhone)
  phone: string;
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  country: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(500)
  @ValidateIf((_, value) => value !== "")
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  linkedin: string = "";
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  title: string;
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(70)
  @ApiProperty({ required: true, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  experience: number;
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  expertise: string;
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  organization: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @MaxLength(5000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  prevExperience: string = "";
}
export class RejectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  reason: string;
}
export class NotificationDto {
  @ValidateIf((_, value) => value !== undefined)
  @IsString()
  @ApiProperty({ required: false, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  notificationId?: string;
}
export class DemoDto {
  @IsIn([
    "customer",
    "provider",
    "admin",
    "superuser",
    "staffAdmin",
    "arbitrator",
  ])
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  role: string;
}
export class CustomJobDto {
  @IsString()
  @MaxLength(100)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  category: string;
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  title: string;
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  location: string;
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  description: string;
  @IsString()
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  preferredDate: string;
  @ValidateIf((_, value) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @ApiProperty({ required: false, type: Number })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  budget?: number;
  @IsString()
  @MaxLength(120)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  contactName: string;
  @IsString()
  @MaxLength(30)
  @ApiProperty({ required: true, type: String })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  contactPhone: string;
}
