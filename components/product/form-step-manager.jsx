'use client';

import { Separator } from '../ui/separator';
import { ChevronRightIcon } from 'lucide-react';
import FormStepItem from './form-step-item';
import { Fragment } from 'react';

export default function FormStepManager({
  formSteps,
  onFormStepsChange,
}) {
  const handleNextStep = () => {
    let activeIndex;
    onFormStepsChange(formSteps.map((step, index) => {
      if (step.status === 'active') {
        activeIndex = index;
        return {
          ...step,
          status: 'complete',
        };
      }

      if (index === activeIndex + 1) {
        return {
          ...step,
          status: 'active',
        };
      }

      return step;
    }));
  };

  const handlePrevStep = () => {
    let prevActiveIndex;
    onFormStepsChange(formSteps.map((step, index) => {
      if (formSteps[index + 1]?.status === 'active') {
        prevActiveIndex = index + 1;
        return {
          ...step,
          status: 'active',
        };
      }

      if (index === prevActiveIndex) {
        return {
          ...step,
          status: 'nonactive',
        };
      }

      return step;
    }));
  };

  const handleResetStep = () => {
    onFormStepsChange(formSteps.map(step => {
      if (step.label === 'Basic') {
        return {
          ...step,
          status: 'active',
        };
      }
      return {
        ...step,
        status: 'nonactive',
      };
    }));
  };

  return (
    <div className="lg:max-w-2/3">
      <div className="flex gap-4 mb-5 font-medium text-zinc-700/90 dark:text-zinc-200 items-center">
        {formSteps.map((step, index) => (
          <Fragment key={step.label}>
            <FormStepItem stepNumber={index + 1} status={step.status} label={step.label} />
            {index < 3 &&
              <ChevronRightIcon
                className={`size-4 text-zinc-700/60 dark:text-zinc-500 ${step.status === 'nonactive' ? 'opacity-50' : ''}`}
              />}
          </Fragment>
        ))}
      </div>

      <Separator className="mb-7" />

      {formSteps.map(step => {
        if (step.status === 'active') {
          return step.render({
            key: step.label,
            onNextStep: handleNextStep,
            onPrevStep: handlePrevStep,
            onResetStep: handleResetStep,
          });
        }
        return null;
      })}
    </div>
  );
}
