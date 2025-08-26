'use client';

import { useState } from 'react';
import BasicForm from './basic-form';
import ContentForm from './content-form';
import ExtrasForm from './extras-form';
import PricingForm from './pricing-form';
import FormStepManager from './form-step-manager';

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

  const [formSteps, setFormSteps] = useState(
    stepDefinitions.map((step, index) => ({
      label: step.label,
      status: index === 0 ? 'active' : 'nonactive',
    })),
  );

  return (
    <FormStepManager
      stepDefinitions={stepDefinitions}
      formSteps={formSteps}
      onFormStepsChange={setFormSteps}
      mode="edit"
    />
  );
}
