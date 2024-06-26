import { useContext, useEffect, useMemo, useRef, useState } from "react";
import HouseAnalyzingContext, {
  AVG_ANNUAL_YIELD,
  DOWN_PAYMENT_FIELD,
  HOME_PRICE_FIELD,
  MORTGAGE_RATE_FIELD,
  PROPERTY_TAX_FIELD,
  RENTAL_BASE_FIELD,
  RENTAL_RAISE_FIELD,
  YEARS_FIELD,
} from "../../../context/HouseAnalyzingProvider/HouseAnalyzingContext";
import ReactECharts, { EChartsInstance } from "echarts-for-react";
import { simulate } from "./utils";
import {
  Button,
  Fieldset,
  Group,
  Paper,
  Slider,
  Switch,
  Text,
  rem,
} from "@mantine/core";
import {
  IconArrowBack,
  IconSettings,
  IconSettings2,
} from "@tabler/icons-react";
import { Carousel } from "@mantine/carousel";
import ConfigurationDrawer from "./ConfigurationDrawer";

const homeFactorMapping: Record<string, number> = {
  0: 1,
  25: 3,
  50: 5,
  75: 7,
  100: 9,
};

export default ({ onPrev }: { onPrev: () => void }) => {
  const context = useContext(HouseAnalyzingContext);
  const [homePriceFactor, setHomePriceFactor] = useState(50);
  const [showAll, setShowAll] = useState(false);
  const [showUpdateDrawer, setShowUpdateDrawer] = useState(false);

  const echartsRefDiff = useRef<EChartsInstance>(null);

  const updateChartDifference = (newOptions: any) => {
    if (echartsRefDiff.current) {
      const echartsInstance = echartsRefDiff.current.getEchartsInstance();
      echartsInstance.clear();
      echartsInstance.setOption(newOptions, true);
    }
  };

  const options = useMemo(() => {
    const lines = simulate({
      homePrice: context[HOME_PRICE_FIELD],
      downPayment: context[DOWN_PAYMENT_FIELD],
      years: context[YEARS_FIELD],
      houseTaxRate: context[PROPERTY_TAX_FIELD] / 100,
      maxReturn: homeFactorMapping[homePriceFactor],
      rentalBaseMonthly: context[RENTAL_BASE_FIELD],
      rentalRaiseAnnual: context[RENTAL_RAISE_FIELD] / 100,
      mortgageInterestRate: context[MORTGAGE_RATE_FIELD] / 100,
      averageAnnualInvestmentYield: context[AVG_ANNUAL_YIELD] / 100,
    });

    const rentals: number[] = [];
    [...Array(context[YEARS_FIELD]).keys()].reduce((acc, i) => {
      const ret = Math.round(
        context[RENTAL_BASE_FIELD] *
          Math.pow(1 + context[RENTAL_RAISE_FIELD] / 100, i) *
          12 +
          acc
      );
      rentals.push(ret);
      return ret;
    }, 0);

    const differenceTrendOptions = {
      title: {
        text: "Investment difference trends",
        subtext:
          "Home value (subtract debt) - Total value of the alernative investment method (subtract rental costs)",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: [...Array(context[YEARS_FIELD]).keys()].map(
          (i) => `Year ${i + 1}`
        ),
      },
      yAxis: {
        type: "value",
      },
      series: showAll
        ? lines.map((line, i) => {
            return {
              name: `Home increase ${i * 100}% (${context[YEARS_FIELD]} years)`,
              type: "line",
              smooth: true,
              data: line.diffs,
            };
          })
        : [
            {
              name: `Home value increases ${
                (homeFactorMapping[homePriceFactor] - 1) * 100
              }%`,
              type: "line",
              smooth: true,
              data: lines.at(-1)?.diffs,
            },
          ],
    };
    const costsOverReturnOptions = {
      title: {
        text: "Buy home spends VS investment return (subtract rental costs)",
        subtext: `Assume home value increases ${
          homeFactorMapping[homePriceFactor] - 1
        } times`,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: [...Array(context[YEARS_FIELD]).keys()].map(
          (i) => `Year ${i + 1}`
        ),
      },
      yAxis: {
        type: "value",
      },
      series: [
        {
          name: "Cumulative Costs",
          type: "line",
          smooth: true,
          data: lines.at(-1)?.totalCosts,
        },
        {
          name: "Cumulative Investment return",
          type: "line",
          smooth: true,
          data: lines.at(-1)?.investmentReturns,
        },
      ],
    };
    const rentalsOverReturns = {
      title: {
        text: "Rental monthly VS Cumulative investment return",
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "cross",
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: [...Array(context[YEARS_FIELD]).keys()].map(
          (i) => `Year ${i + 1}`
        ),
      },
      yAxis: [
        {
          type: "value",
        },
      ],
      series: [
        {
          name: "Cumulative rental costs",
          type: "line",
          smooth: true,
          data: rentals,
        },
        {
          name: "Cumulative investment return",
          type: "line",
          smooth: true,
          data: lines.at(-1)?.investmentReturns,
        },
        {
          name: "Cumulative Investment return (subtract rental costs)",
          type: "bar",

          data: lines
            .at(-1)
            ?.investmentReturns.map((ret, i) => ret + rentals[i]),
        },
      ],
    };

    return {
      differenceTrendOptions,
      costsOverReturnOptions,
      rentalsOverReturns,
    };
  }, [context, homePriceFactor, showAll]);

  useEffect(() => {
    updateChartDifference(options.differenceTrendOptions);
  }, [options]);

  return (
    <div className="flex flex-col max-w-[1200px] min-w-[1200px]">
      {showUpdateDrawer && (
        <ConfigurationDrawer onClose={() => setShowUpdateDrawer(false)} />
      )}
      <Fieldset className="mb-4" pl="lg" pt="lg" pb="lg">
        <Group>
          <div>
            <Text>The estimation of the home price</Text>
            <Slider
              color="blue"
              step={25}
              label={null}
              defaultValue={50}
              marks={Object.keys(homeFactorMapping).map((k) => {
                return {
                  value: Number(k),
                  label: String(homeFactorMapping[k]),
                };
              })}
              value={homePriceFactor}
              onChange={(v) => {
                setHomePriceFactor(v);
              }}
              className="w-[300px]"
            />
          </div>
          <div className="pt-3 ml-8">
            <Text className="mb-1">Show all trends</Text>
            <Switch
              checked={showAll}
              onChange={(v) => setShowAll(v.target.checked)}
              className="cursor-pointer"
            />
          </div>
          <Group className="ml-auto mr-4">
            <Button
              leftSection={<IconSettings2 size={14} />}
              onClick={() => setShowUpdateDrawer(true)}
            >
              Update configuration
            </Button>
            <Button
              leftSection={<IconArrowBack size={14} />}
              onClick={onPrev}
              variant="light"
              color="red"
            >
              Go back
            </Button>
          </Group>
        </Group>
      </Fieldset>
      <Carousel slidesToScroll={1} align="start" withIndicators loop>
        <Carousel.Slide key="diff">
          <ReactECharts
            option={options.differenceTrendOptions}
            style={{ width: "100%", height: 480 }}
            ref={echartsRefDiff}
          />
        </Carousel.Slide>
        <Carousel.Slide key="costs-returns">
          <ReactECharts
            option={options.costsOverReturnOptions}
            style={{ width: "100%", height: 480 }}
          />
        </Carousel.Slide>
        <Carousel.Slide key="rentals-returns">
          <ReactECharts
            option={options.rentalsOverReturns}
            style={{ width: "100%", height: 480 }}
          />
        </Carousel.Slide>
      </Carousel>
    </div>
  );
};
