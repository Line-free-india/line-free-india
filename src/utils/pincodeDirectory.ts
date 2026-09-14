/**
 * Lightweight Indian PIN code directory & prefix lookup engine.
 * Validates 6-digit Indian PIN codes and resolves State / Postal Circle.
 */

export interface PincodeInfo {
  pincode: string;
  state: string;
  region: string;
  isValid: boolean;
}

const PIN_PREFIX_MAP: Record<string, { state: string; region: string }> = {
  // Region 1: Northern (Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir, Chandigarh)
  '11': { state: 'Delhi', region: 'National Capital Region' },
  '12': { state: 'Haryana', region: 'Gurugram / Faridabad / Rohtak' },
  '13': { state: 'Haryana', region: 'Ambala / Kurukshetra / Karnal' },
  '14': { state: 'Punjab', region: 'Ludhiana / Jalandhar / Amritsar' },
  '15': { state: 'Punjab', region: 'Bathinda / Firozpur' },
  '16': { state: 'Chandigarh / Punjab', region: 'Tricity Area' },
  '17': { state: 'Himachal Pradesh', region: 'Shimla / Kangra / Mandi' },
  '18': { state: 'Jammu & Kashmir', region: 'Jammu Circle' },
  '19': { state: 'Jammu & Kashmir / Ladakh', region: 'Srinagar / Leh' },

  // Region 2: Northern (Uttar Pradesh, Uttarakhand)
  '20': { state: 'Uttar Pradesh', region: 'Aligarh / Noida / Meerut' },
  '21': { state: 'Uttar Pradesh', region: 'Prayagraj / Kanpur' },
  '22': { state: 'Uttar Pradesh', region: 'Lucknow / Ayodhya / Varanasi' },
  '23': { state: 'Uttar Pradesh', region: 'Mirzapur / Sonbhadra' },
  '24': { state: 'Uttarakhand / UP', region: 'Dehradun / Haridwar / Moradabad' },
  '25': { state: 'Uttar Pradesh', region: 'Muzaffarnagar / Saharanpur' },
  '26': { state: 'Uttarakhand / UP', region: 'Nainital / Bareilly' },
  '27': { state: 'Uttar Pradesh', region: 'Gorakhpur / Basti' },
  '28': { state: 'Uttar Pradesh', region: 'Agra / Jhansi' },

  // Region 3: Western (Rajasthan, Gujarat, Daman & Diu)
  '30': { state: 'Rajasthan', region: 'Jaipur Circle' },
  '31': { state: 'Rajasthan', region: 'Udaipur / Kota' },
  '32': { state: 'Rajasthan', region: 'Ajmer / Bharatpur' },
  '33': { state: 'Rajasthan', region: 'Bikaner / Jodhpur' },
  '34': { state: 'Rajasthan', region: 'Jodhpur / Barmer' },
  '36': { state: 'Gujarat', region: 'Rajkot / Saurashtra' },
  '37': { state: 'Gujarat', region: 'Kutch / Jamnagar' },
  '38': { state: 'Gujarat', region: 'Ahmedabad / Gandhinagar' },
  '39': { state: 'Gujarat / Daman', region: 'Surat / Vadodara / Vapi' },

  // Region 4: Western (Maharashtra, Goa, Madhya Pradesh, Chhattisgarh)
  '40': { state: 'Maharashtra / Goa', region: 'Mumbai / Panaji' },
  '41': { state: 'Maharashtra', region: 'Pune / Kolhapur / Nashik' },
  '42': { state: 'Maharashtra', region: 'Thane / Jalgaon' },
  '43': { state: 'Maharashtra', region: 'Aurangabad / Nanded' },
  '44': { state: 'Maharashtra', region: 'Nagpur / Amravati' },
  '45': { state: 'Madhya Pradesh', region: 'Indore / Ujjain' },
  '46': { state: 'Madhya Pradesh', region: 'Bhopal / Hoshangabad' },
  '47': { state: 'Madhya Pradesh', region: 'Gwalior / Morena' },
  '48': { state: 'Madhya Pradesh', region: 'Jabalpur / Sagar' },
  '49': { state: 'Chhattisgarh', region: 'Raipur / Bilaspur / Durg' },

  // Region 5: Southern (Andhra Pradesh, Telangana, Karnataka)
  '50': { state: 'Telangana', region: 'Hyderabad / Secunderabad' },
  '51': { state: 'Andhra Pradesh', region: 'Tirupati / Kadapa / Kurnool' },
  '52': { state: 'Andhra Pradesh', region: 'Vijayawada / Guntur' },
  '53': { state: 'Andhra Pradesh', region: 'Visakhapatnam / Kakinada' },
  '56': { state: 'Karnataka', region: 'Bengaluru Urban / Rural' },
  '57': { state: 'Karnataka', region: 'Mangaluru / Mysuru / Udupi' },
  '58': { state: 'Karnataka', region: 'Hubballi / Belagavi / Kalaburagi' },
  '59': { state: 'Karnataka', region: 'Belagavi / Bagalkot' },

  // Region 6: Southern (Tamil Nadu, Kerala, Lakshadweep, Puducherry)
  '60': { state: 'Tamil Nadu', region: 'Chennai / Kanchipuram' },
  '61': { state: 'Tamil Nadu', region: 'Tiruchirappalli / Thanjavur' },
  '62': { state: 'Tamil Nadu', region: 'Madurai / Tirunelveli' },
  '63': { state: 'Tamil Nadu', region: 'Salem / Vellore / Erode' },
  '64': { state: 'Tamil Nadu', region: 'Coimbatore / Tiruppur' },
  '67': { state: 'Kerala', region: 'Kozhikode / Kannur' },
  '68': { state: 'Kerala', region: 'Kochi / Thrissur' },
  '69': { state: 'Kerala', region: 'Thiruvananthapuram / Kollam' },

  // Region 7: Eastern (West Bengal, Odisha, North Eastern States)
  '70': { state: 'West Bengal', region: 'Kolkata Metropolitan' },
  '71': { state: 'West Bengal', region: 'Howrah / Hooghly' },
  '72': { state: 'West Bengal', region: 'Midnapore / Kharagpur' },
  '73': { state: 'West Bengal / Sikkim', region: 'Siliguri / Darjeeling / Gangtok' },
  '74': { state: 'West Bengal', region: 'North 24 Parganas' },
  '75': { state: 'Odisha', region: 'Bhubaneswar / Cuttack / Puri' },
  '76': { state: 'Odisha', region: 'Berhampur / Koraput' },
  '77': { state: 'Odisha', region: 'Rourkela / Sambalpur' },
  '78': { state: 'Assam', region: 'Guwahati / Dibrugarh' },
  '79': { state: 'North East', region: 'Meghalaya / Manipur / Nagaland / Tripura' },

  // Region 8: Eastern (Bihar, Jharkhand)
  '80': { state: 'Bihar', region: 'Patna / Nalanda / Gaya' },
  '81': { state: 'Bihar / Jharkhand', region: 'Bhagalpur / Munger / Deoghar' },
  '82': { state: 'Jharkhand / Bihar', region: 'Dhanbad / Bokaro / Hazaribagh' },
  '83': { state: 'Jharkhand', region: 'Ranchi / Jamshedpur' },
  '84': { state: 'Bihar', region: 'Muzaffarpur / Vaishali / Saran' },
  '85': { state: 'Bihar', region: 'Purnia / Katihar / Saharsa' },
};

/**
 * Validates whether a given string is a valid 6-digit Indian PIN code.
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode.trim());
}

/**
 * Resolves postal circle information from a 6-digit PIN code.
 */
export function lookupPincode(pincode: string): PincodeInfo {
  const cleanPin = pincode.trim();
  const valid = isValidPincode(cleanPin);

  if (!valid) {
    return {
      pincode: cleanPin,
      state: 'Unknown',
      region: 'Invalid PIN Code',
      isValid: false,
    };
  }

  const prefix = cleanPin.slice(0, 2);
  const match = PIN_PREFIX_MAP[prefix];

  if (match) {
    return {
      pincode: cleanPin,
      state: match.state,
      region: match.region,
      isValid: true,
    };
  }

  return {
    pincode: cleanPin,
    state: 'India',
    region: 'Postal Zone ' + cleanPin[0],
    isValid: true,
  };
}
