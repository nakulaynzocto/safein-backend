import { SafeinProfile } from '../../models/safeinProfile/safeinProfile.model';
import { ISafeinProfileResponse, IUpdateSafeinProfileDTO } from '../../types/safeinProfile/safeinProfile.types';
import { CONSTANTS } from '../../utils/constants';

export class SafeinProfileService {
    /**
     * Get the singleton SafeIn profile (creates with defaults if doesn't exist)
     */
    static async getSafeinProfile(): Promise<ISafeinProfileResponse> {
        try {
            // Match Dashboard logic: Try to find Default first
            let profile = await SafeinProfile.findOne({ isDefault: true });

            // If no default, get the first one (Dashboard fallback)
            if (!profile) {
                profile = await SafeinProfile.findOne();
            }

            // If no profile exists at all, create one with default values from CONSTANTS
            if (!profile) {
                const defaults = CONSTANTS.COMPANY_BILLING_DETAILS;
                profile = await SafeinProfile.create({
                    companyDetails: {
                        name: defaults.name,
                        cin: defaults.cin,
                        gstin: defaults.gstin,
                        email: defaults.email,
                        phone: defaults.phone,
                        address: typeof defaults.address === 'object' ?
                            `${defaults.address.street}, ${defaults.address.city}, ${defaults.address.state}` :
                            defaults.address
                    }
                });
            }

            return this.formatSafeinProfileResponse(profile);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Update the SafeIn profile
     */
    static async updateSafeinProfile(
        updateData: IUpdateSafeinProfileDTO
    ): Promise<ISafeinProfileResponse> {
        try {
            // Get or create profile (match get logic)
            let profile = await SafeinProfile.findOne({ isDefault: true });

            if (!profile) {
                profile = await SafeinProfile.findOne();
            }

            if (!profile) {
                // If no profile exists, create one 
                const defaults = CONSTANTS.COMPANY_BILLING_DETAILS;
                // Construct initial data
                const initialData = {
                    companyDetails: {
                        name: defaults.name,
                        email: defaults.email,
                        ...updateData.companyDetails
                    },
                    ...updateData
                };
                profile = await SafeinProfile.create(initialData);
            } else {
                // Update existing profile
                // We need to merge nested objects carefully
                if (updateData.companyDetails) {
                    profile.companyDetails = { ...profile.companyDetails, ...updateData.companyDetails };
                }
                if (updateData.bankDetails) profile.bankDetails = { ...profile.bankDetails, ...updateData.bankDetails };
                if (updateData.documentSettings) profile.documentSettings = { ...profile.documentSettings, ...updateData.documentSettings };
                if (updateData.localization) profile.localization = { ...profile.localization, ...updateData.localization };
                if (updateData.appearance) profile.appearance = { ...profile.appearance, ...updateData.appearance };
                if (updateData.defaults) profile.defaults = { ...profile.defaults, ...updateData.defaults };

                if (updateData.isActive !== undefined) profile.isActive = updateData.isActive;
                if (updateData.isDefault !== undefined) profile.isDefault = updateData.isDefault;

                await profile.save();
            }

            return this.formatSafeinProfileResponse(profile);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Format SafeIn profile response
     */
    private static formatSafeinProfileResponse(profile: any): ISafeinProfileResponse {
        return {
            _id: profile._id.toString(),
            companyDetails: profile.companyDetails,
            bankDetails: profile.bankDetails,
            documentSettings: profile.documentSettings,
            localization: profile.localization,
            appearance: profile.appearance,
            defaults: profile.defaults,
            isActive: profile.isActive,
            isDefault: profile.isDefault,
            createdAt: profile.createdAt,
            updatedAt: profile.updatedAt,
        };
    }
}
