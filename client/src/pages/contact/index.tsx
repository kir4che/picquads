import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAlert } from '../../hooks/useAlert';

import FormField from '../../components/FormField';

// 定義表單驗證規則
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
});

type FormData = z.infer<typeof formSchema>;

const Contact: React.FC = () => {
  const { setAlert } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register, // 註冊表單欄位
    handleSubmit,
    reset, // 重置表單
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema), // 設定使用 Zod 驗證
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to send message');

      setAlert(
        'Message sent successfully! We will get back to you soon.',
        'success'
      );
      reset();
    } catch {
      setAlert('Failed to send message. Please try again later.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className='flex flex-col items-center justify-center'>
      <h1 className='mb-8 text-center text-3xl font-bold text-violet-900'>
        Contact Us
      </h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='w-full max-w-lg space-y-4 px-6 sm:px-0'
      >
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
          <FormField
            id='name'
            label='Name'
            required
            error={errors.name?.message}
            {...register('name')}
          />
          <FormField
            id='email'
            type='email'
            label='Email'
            required
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <FormField
          id='content'
          label='Content'
          isTextArea
          rows={5}
          required
          error={errors.content?.message}
          className='focus:ring-1 focus:ring-violet-400'
          {...register('content')}
        />
        <button
          type='submit'
          disabled={isSubmitting}
          className='mt-8 w-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg transition duration-200 ease-in-out hover:from-violet-600 hover:to-violet-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-60'
          aria-label='Send message'
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </form>
    </main>
  );
};

export default Contact;
