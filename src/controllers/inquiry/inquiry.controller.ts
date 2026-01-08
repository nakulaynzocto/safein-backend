import { Request, Response, NextFunction } from 'express';
import { Inquiry } from '../../models/inquiry/inquiry.model';
import { ResponseUtil } from '../../utils/response.util';
import { TryCatch } from '../../decorators';
import { AppError } from '../../middlewares/errorHandler';
import { ERROR_CODES } from '../../utils/constants';

export class InquiryController {

    @TryCatch('Failed to submit inquiry')
    public async createInquiry(req: Request, res: Response, _next: NextFunction) {
        const { name, email, phone, message, source } = req.body;

        const inquiry = await Inquiry.create({
            name,
            email,
            phone,
            message,
            source: source || 'safein'
        });

        ResponseUtil.created(res, 'Your inquiry has been submitted successfully. We will get back to you soon.', inquiry);
    }

    @TryCatch('Failed to fetch inquiries')
    public async getAllInquiries(req: Request, res: Response, _next: NextFunction) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [inquiries, total] = await Promise.all([
            Inquiry.find({ isDeleted: false })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Inquiry.countDocuments({ isDeleted: false })
        ]);

        ResponseUtil.success(res, 'Inquiries fetched successfully', {
            inquiries,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    }

    @TryCatch('Failed to update inquiry status')
    public async updateInquiryStatus(req: Request, res: Response, _next: NextFunction) {
        const { status } = req.body;
        const { id } = req.params;

        const inquiry = await Inquiry.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!inquiry) {
            throw new AppError('Inquiry not found', ERROR_CODES.NOT_FOUND);
        }

        ResponseUtil.success(res, 'Inquiry status updated successfully', inquiry);
    }

    @TryCatch('Failed to delete inquiry')
    public async deleteInquiry(req: Request, res: Response, _next: NextFunction) {
        const { id } = req.params;

        const inquiry = await Inquiry.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true }
        );

        if (!inquiry) {
            throw new AppError('Inquiry not found', ERROR_CODES.NOT_FOUND);
        }

        ResponseUtil.success(res, 'Inquiry archived successfully', inquiry);
    }
}
