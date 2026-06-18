import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullname: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
  confirm_password: z.string().min(8, 'Vui lòng xác nhận mật khẩu'),
  terms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với điều khoản',
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Mật khẩu không khớp',
  path: ['confirm_password'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
