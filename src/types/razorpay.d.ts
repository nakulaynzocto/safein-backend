declare module "razorpay" {
    interface RazorpayOrder {
        id: string;
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, any>;
    }

    interface RazorpayOrderCreateRequest {
        amount: number;
        currency: string;
        receipt?: string;
        notes?: Record<string, any>;
    }

    interface RazorpayInstanceOptions {
        key_id: string;
        key_secret: string;
    }

    class Razorpay {
        constructor(options: RazorpayInstanceOptions);
        orders: {
            create: (params: RazorpayOrderCreateRequest) => Promise<RazorpayOrder>;
        };
    }

    export = Razorpay;
}
