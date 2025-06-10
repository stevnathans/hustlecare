'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vendor } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const vendorFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  logo: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type VendorFormValues = z.infer<typeof vendorFormSchema>;

interface VendorFormProps {
  vendor?: Vendor;
  onSubmit: (values: VendorFormValues) => Promise<void>;
}

export function VendorForm({ vendor, onSubmit }: VendorFormProps) {
  const router = useRouter();
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: vendor?.name || '',
      website: vendor?.website || '',
      logo: vendor?.logo || '',
    },
  });

  const handleSubmit = async (values: VendorFormValues) => {
    try {
      await onSubmit(values);
      toast.success(`Vendor ${vendor ? 'updated' : 'created'} successfully`);
      router.push('/vendors');
    } catch (error) {
      toast.error(`Failed to ${vendor ? 'update' : 'create'} vendor`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vendor Name</FormLabel>
              <FormControl>
                <Input placeholder="Vendor name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/logo.png" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/vendors')}
          >
            Cancel
          </Button>
          <Button type="submit">
            {vendor ? 'Update' : 'Create'} Vendor
          </Button>
        </div>
      </form>
    </Form>
  );
}