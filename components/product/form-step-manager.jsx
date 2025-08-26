'use client';

import { Separator } from '../ui/separator';
import { ChevronRightIcon } from 'lucide-react';
import FormStepItem from './form-step-item';
import { Fragment } from 'react';
import { PriceType } from '@/constants/enums';

export default function FormStepManager({
  stepDefinitions,
  formSteps,
  onFormStepsChange,
  mode = 'create',
}) {
  const handleNextStep = () => {
    let activeIndex;
    onFormStepsChange((prevSteps) => prevSteps.map((step, index) => {
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
    onFormStepsChange((prevSteps) => prevSteps.map((step, index) => {
      if (prevSteps[index + 1]?.status === 'active') {
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
    onFormStepsChange((prevSteps) => prevSteps.map(step => {
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

  const handlePricingStepVisibility = (priceType) => {
    if (mode === 'edit') {
      if (priceType === PriceType.FREE) {
        onFormStepsChange((prevSteps) => prevSteps.filter((step) => step.label !== 'Pricing'));
      } else {
        onFormStepsChange((prevSteps) => {
          const hasPricingStep = prevSteps.some((step) => step.label === 'Pricing');

          if (!hasPricingStep) {
            return [
              ...prevSteps,
              {
                label: stepDefinitions[stepDefinitions.length - 1].label,
                status: 'nonactive',
              },
            ];
          }

          return prevSteps;
        });
      }
    }
  };

  return (
    <>
      <div className="flex gap-4 mb-5 font-medium text-zinc-700/90 dark:text-zinc-200 items-center">
        {formSteps.map((step, index) => (
          <Fragment key={step.label}>
            <FormStepItem stepNumber={index + 1} status={step.status} label={step.label} />
            {index < formSteps.length - 1 &&
              <ChevronRightIcon
                className={`size-4 text-zinc-700/60 dark:text-zinc-500 ${step.status === 'nonactive' ? 'opacity-50' : ''}`}
              />}
          </Fragment>
        ))}
      </div>

      <Separator className="mb-7" />

      {formSteps.map((step, index) => {
        if (step.status === 'active') {
          const StepComponent = stepDefinitions[index].component;

          return (
            <StepComponent
              key={step.label}
              mode={mode}
              onNextStep={() => handleNextStep(index)}
              onPrevStep={() => handlePrevStep(index)}
              onResetStep={handleResetStep}             
              {...(step.label === 'Basic' ? { onPricingStepVisibility: handlePricingStepVisibility } : {})}
              {...stepDefinitions[index].extraProps}
            />
          );
        }

        return null;
      })}
    </>
  );
}
