'use client';

import { useState } from 'react';
import BasicForm from './basic-form';
import ContentForm from './content-form';
import ExtrasForm from './extras-form';
import PricingForm from './pricing-form';
import FormStepManager from './form-step-manager';

export default function CreateForm({
  categories,
  owners,
  licenses,
}) {

  const [formSteps, setFormSteps] = useState([
    {
      label: 'Basic',
      status: 'active',
      render: ({ key, onNextStep }) =>
        <BasicForm
          key={key}
          onNextStep={onNextStep}
          categories={categories}
          owners={owners}
          licenses={licenses}
        />,
    },
    {
      label: 'Content',
      status: 'nonactive',
      render: ({ key, onNextStep, onPrevStep }) =>
        <ContentForm
          key={key}
          onNextStep={onNextStep}
          onPrevStep={onPrevStep}
        />,
    },
    {
      label: 'Extras',
      status: 'nonactive',
      render: ({ key, onNextStep, onPrevStep }) =>
        <ExtrasForm
          key={key}
          onNextStep={onNextStep}
          onPrevStep={onPrevStep}
        />
    },
    {
      label: 'Pricing',
      status: 'nonactive',
      render: ({ key, onPrevStep, onResetStep }) =>
        <PricingForm
          key={key}
          onPrevStep={onPrevStep}
          onResetStep={onResetStep}
        />
    },
  ]);

  return <FormStepManager formSteps={formSteps} onFormStepsChange={setFormSteps} />;
}
