'use client';

import { Separator } from '../ui/separator';
import { ChevronRightIcon } from 'lucide-react';
import FormStepItem from './form-step-item';
import { Fragment, useState } from 'react';
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
  const [formSteps, setFormSteps] = useState([
    {
      label: 'Basic',
      status: 'nonactive',
      render: ({ key, onNextStep }) =>
        <BasicForm
          key={key}
          mode="edit"
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
          mode="edit"
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
          mode="edit"
          onNextStep={onNextStep}
          onPrevStep={onPrevStep}
        />
    },
    {
      label: 'Pricing',
      status: 'active',
      render: ({ key, onPrevStep, onResetStep }) =>
        <PricingForm
          key={key}
          mode="edit"
          onPrevStep={onPrevStep}
          onResetStep={onResetStep}
        />
    },
  ]);

  return <FormStepManager formSteps={formSteps} onFormStepsChange={setFormSteps} />;
}
