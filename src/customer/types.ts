export type PhoneNumber =
  | string
  | {
      national_number: string;
      country_code: string;
    };

// Customer has only two mandatory fields: name and email, rest are optional.
export interface Customer {
  url?: string;
  uuid?: string;
  email: string;
  name: string;
  display_name?: string;
  abbreviation?: string;
  access_subnets?: string;
  accounting_start_date?: string;
  address?: string;
  agreement_number?: string;
  sponsor_number?: string;
  bank_account?: string;
  bank_name?: string;
  contact_details?: string;
  country_name?: string;
  country?: string;
  default_tax_percent?: string;
  native_name?: string;
  phone_number?: PhoneNumber;
  postal?: string;
  registration_code?: string;
  domain?: string;
  homepage?: string;
  vat_code?: string;
  image?: string;
  is_service_provider?: boolean;
  created?: string;
  division?: string;
  division_name?: string;
  division_parent_name?: string;
  latitude?: number;
  longitude?: number;
}
