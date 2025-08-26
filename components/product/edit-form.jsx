'use client';

import { useState } from 'react';
import BasicForm from './basic-form';
import ContentForm from './content-form';
import ExtrasForm from './extras-form';
import PricingForm from './pricing-form';
import FormStepManager from './form-step-manager';
import { useProductFormStore } from '@/lib/providers/product-form-store-provider';
import { PriceType } from '@/constants/enums';

export default function EditForm({
  categories,
  owners,
  licenses,
}) {
  const stepDefinitions = [
    { label: 'Basic', component: BasicForm, extraProps: { categories, owners, licenses } },
    { label: 'Content', component: ContentForm, extraProps: {} },
    { label: 'Extras', component: ExtrasForm, extraProps: {} },
    { label: 'Pricing', component: PricingForm, extraProps: {} },
  ];

  const priceType = useProductFormStore((state) => state.basic.price_type);

  let availableSteps = stepDefinitions.map((step, index) => ({
    label: step.label,
    status: index === 0 ? 'active' : 'nonactive',
  }));
  if (priceType === PriceType.FREE) {
    availableSteps = availableSteps.filter((step) => step.label !== 'Pricing');
  }

  const [formSteps, setFormSteps] = useState(availableSteps);

  return (
    <FormStepManager
      stepDefinitions={stepDefinitions}
      formSteps={formSteps}
      onFormStepsChange={setFormSteps}
      mode="edit"
    />
  );
}
