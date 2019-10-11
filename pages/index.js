import { Form, Select } from "antd"
import Highcharts from "highcharts"
import HighchartsReact from "highcharts-react-official"
import HighchartsExporting from "highcharts/modules/exporting"
import React, { Component } from "react"
import Layout from "../components/layout"

const FormItem = Form.Item
const Option = Select.Option

if (typeof Highcharts === "object") {
  HighchartsExporting(Highcharts)
}

const options = {
  title: {
    text: "My chart"
  },
  series: [
    {
      data: [1, 2, 3]
    }
  ]
}

const options2 = {
  chart: {
    type: "column"
  },
  title: {
    text: "Monthly Average Rainfall"
  },
  subtitle: {
    text: "Source: WorldClimate.com"
  },
  xAxis: {
    categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],
    crosshair: true
  },
  yAxis: {
    min: 0,
    title: {
      text: "Rainfall (mm)"
    }
  },
  tooltip: {
    headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
    pointFormat:
      '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
      '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
    footerFormat: "</table>",
    shared: true,
    useHTML: true
  },
  plotOptions: {
    column: {
      pointPadding: 0.2,
      borderWidth: 0
    }
  },
  series: [
    {
      name: "Tokyo",
      data: [
        49.9,
        71.5,
        106.4,
        129.2,
        144.0,
        176.0,
        135.6,
        148.5,
        216.4,
        194.1,
        95.6,
        54.4
      ]
    },
    {
      name: "New York",
      data: [
        83.6,
        78.8,
        98.5,
        93.4,
        106.0,
        84.5,
        105.0,
        104.3,
        91.2,
        83.5,
        106.6,
        92.3
      ]
    },
    {
      name: "London",
      data: [
        48.9,
        38.8,
        39.3,
        41.4,
        47.0,
        48.3,
        59.0,
        59.6,
        52.4,
        65.2,
        59.3,
        51.2
      ]
    },
    {
      name: "Berlin",
      data: [
        42.4,
        33.2,
        34.5,
        39.7,
        52.6,
        75.5,
        57.4,
        60.4,
        47.6,
        39.1,
        46.8,
        51.1
      ]
    }
  ]
}

class Index extends Component {
  render() {
    return (
      <Layout title="หน้าหลัก" breadcrumb="">
        <div>
          <div className="row hidden">
            <div className="col-md-6">
              <HighchartsReact highcharts={Highcharts} options={options2} />
            </div>
            <div className="col-md-6">
              <HighchartsReact highcharts={Highcharts} options={options} />
            </div>
          </div>
          <div className="hero">
            <h1 className="title">Welcome to Next.js!</h1>
          </div>

          <style jsx>{`
            .hero {
              width: 100%;
              color: #333;
            }
            .title {
              margin: 0;
              width: 100%;
              padding-top: 80px;
              line-height: 1.15;
              font-size: 48px;
            }
            .title,
            .description {
              text-align: center;
            }
            .row-grid {
              max-width: 880px;
              margin: 80px auto 40px;
              display: flex;
              flex-direction: row;
              justify-content: space-around;
            }
            .card {
              padding: 18px 18px 24px;
              width: 220px;
              text-align: left;
              text-decoration: none;
              color: #434343;
              border: 1px solid #9b9b9b;
            }
            .card:hover {
              border-color: #067df7;
            }
            .card h3 {
              margin: 0;
              color: #067df7;
              font-size: 18px;
            }
            .card p {
              margin: 0;
              padding: 12px 0 0;
              font-size: 13px;
              color: #333;
            }
          `}</style>
        </div>
      </Layout>
    )
  }
}

export default Index
