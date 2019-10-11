import { Button, Divider, Input, Modal, Select, Table } from "antd"
import classNames from "classnames"
import { Formik } from "formik"
import React, { Component } from "react"
import Swal from "sweetalert2"
import * as Yup from "yup"
import axios from "../../../axios"
import Head from "../../../components/head"
import Layout from "../../../components/layout"
import Aux from "../../../hoc/Auxiliary"
import { isEmpty, updateObject } from "../../../utils"
const { Option } = Select

class Index extends Component {
  state = {
    title: "ตั้งค่าตู้ KIOSK",
    loading: false,
    kioskItems: [],
    filterKey: "",
    modalVisible: false,
    confirmLoading: false,
    formAttributes: {
      kiosk_id: "",
      kiosk_name: "",
      kiosk_status: ""
    },
    formState: "create"
  }

  componentDidMount() {
    this.fetchData()
  }

  fetchData = async () => {
    try {
      this.setState({ loading: true })
      const { data } = await axios.get(`/kiosk/list`)
      this.setState({ kioskItems: data, loading: false })
    } catch (error) {
      this.setState({ loading: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  filteredData = () => {
    const { kioskItems, filterKey } = this.state
    const rows = []
    if (kioskItems.length) {
      if (filterKey) {
        const newItems = kioskItems.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return (
              String(row[key])
                .toLowerCase()
                .indexOf(filterKey) > -1
            )
          })
        })
        newItems.map((item, index) => {
          rows.push(Object.assign(item, { key: index + 1 }))
        })
      } else {
        kioskItems.map((item, index) => {
          rows.push(Object.assign(item, { key: index + 1 }))
        })
      }
    }
    return rows
  }

  handleSubmit = async values => {
    this.setState({ confirmLoading: true })
    try {
      if (this.state.formState === "create") {
        const { data } = await axios.put(`/kiosk/create`, values)
        Swal.fire({
          type: "success",
          title: "Success!",
          text: data.message,
          showConfirmButton: false,
          timer: 3000
        })
      } else {
        const { data } = await axios.post(
          `/kiosk/update/${values.kiosk_id}`,
          updateObject(values, {
            kiosk_id: this.state.formAttributes.kiosk_id
          })
        )
        Swal.fire({
          type: "success",
          title: "Success!",
          text: data.message,
          showConfirmButton: false,
          timer: 3000
        })
      }
      this.setState({
        confirmLoading: false,
        modalVisible: false,
        formState: "create",
        formAttributes: {
          kioks_id: "",
          kiosk_name: "",
          kiosk_status: ""
        }
      })
      this.fetchData()
    } catch (error) {
      this.setState({ confirmLoading: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  handleChangeInputSearch = event => {
    this.setState({ filterKey: event.target.value })
  }

  showModal = () => {
    this.setState({
      modalVisible: true,
      formState: "create"
    })
  }

  handleChangeInputForm = e => {
    const formAttributes = this.state.formAttributes
    const updatedFormAttributes = Object.assign(formAttributes, {
      [e.target.id]: e.target.value
    })
    this.setState({ formAttributes: updatedFormAttributes })
  }

  handleChangeSelect = value => {
    const formAttributes = this.state.formAttributes
    const updatedFormAttributes = Object.assign(formAttributes, {
      kiosk_status: value
    })
    this.setState({ formAttributes: updatedFormAttributes })
  }

  handleOk = e => {
    this.handleSubmit(this.state.formAttributes)
  }

  handleCancel = e => {
    this.setState({
      modalVisible: false,
      formState: "create",
      formAttributes: {
        kioks_id: "",
        kiosk_name: "",
        kiosk_status: ""
      }
    })
  }

  hasError = (errors, touched, field) => {
    const isError = !isEmpty((errors[field] && touched[field]) || errors[field])
    return isError ? "has-error" : ""
  }

  handleSubmitSearch = e => {
    e.preventDefault()
  }

  onUpdate = async record => {
    try {
      const { data } = await axios.get(`/kiosk/${record.kiosk_id}`)
      await this.setState({
        formState: "update",
        formAttributes: data
      })
      this.setState({
        modalVisible: true,
      })
    } catch (error) {
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  onDelete = data => {
    const _this = this
    Swal.fire({
      title: "ต้องการลบรายการใช่หรือไม่?",
      text: "",
      type: "warning",
      showCancelButton: true,
      confirmButtonText: "ลบรายการ",
      cancelButtonText: "ยกเลิก",
      showLoaderOnConfirm: true,
      allowOutsideClick: false,
      preConfirm: function() {
        return new Promise(function(resolve) {
          axios
            .delete(`/kiosk/delete/${data.kiosk_id}`)
            .then(res => {
              _this.fetchData()
              resolve(res.data)
            })
            .catch(error => {
              Swal.fire({
                type: "error",
                title: "Oops...",
                text: error.message
              })
            })
        })
      }
    }).then(result => {
      if (result.value) {
        Swal.fire("Deleted!", result.value.message, "success")
      }
    })
  }

  render() {
    const columns = [
      {
        title: "ไอดี",
        dataIndex: "kiosk_id",
        key: "kiosk_id",
        render: text => <a>{text}</a>,
        sorter: true
      },
      {
        title: "ชื่อ",
        dataIndex: "kiosk_name",
        key: "kiosk_name",
        sorter: true
      },
      {
        title: "สถานะ",
        dataIndex: "kiosk_status",
        key: "kiosk_status",
        sorter: true,
        align: "center",
        render: text => <span>{text === 1 ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
      },
      {
        title: "Action",
        key: "action",
        align: "center",
        render: (text, record) => (
          <span>
            <Button type="primary" onClick={() => this.onUpdate(record)}>
              แก้ไข
            </Button>
            <Divider type="vertical" />
            <Button type="danger" onClick={() => this.onDelete(record)}>ลบ</Button>
          </span>
        )
      }
    ]

    return (
      <Aux>
        <Head title={this.state.title} />
        <Layout title={this.state.title} breadcrumb={this.state.title}>
          <div className="row">
            <div className="col-md-12">
              <div className="box">
                <div className="box-header with-border">
                  <h3 className="box-title">{this.state.title}</h3>
                </div>
                {/* /.box-header */}
                <div className="box-body">
                  <div className="row">
                    <div className="col-md-12">
                      <form onSubmit={this.handleSubmitSearch}>
                        <div className="form-group">
                          <div className="col-md-4">
                            <Input
                              placeholder="ค้นหา..."
                              value={this.state.filterKey}
                              onChange={this.handleChangeInputSearch}
                            />
                          </div>
                          <div className="col-md-4">
                            <Button type="primary" onClick={this.showModal}>
                              <i className="fa fa-plus"></i>&nbsp;เพิ่มรายการ
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                  <br />
                  <div className="row">
                    <div className="col-md-12">
                      <Table
                        loading={this.state.loading}
                        columns={columns}
                        dataSource={this.filteredData()}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Modal
            title="เพิ่มรายการ"
            visible={this.state.modalVisible}
            onOk={this.handleOk}
            onCancel={this.handleCancel}
            confirmLoading={this.state.confirmLoading}
            okText="บันทึก"
            cancelText="ยกเลิก"
          >
            <Formik
              initialValues={this.state.formAttributes}
              onSubmit={(values, { setSubmitting }) => {
                this.handleSubmit(values)
                setSubmitting(false)
              }}
              validationSchema={Yup.object().shape({
                kiosk_name: Yup.string().required(),
                kiosk_status: Yup.string().required()
              })}
            >
              {({
                values,
                errors,
                touched,
                handleChange,
                handleSubmit,
                isSubmitting,
                dirty
              }) => (
                <form onSubmit={handleSubmit}>
                  <div
                    className={classNames(
                      "form-group",
                      this.hasError(errors, touched, "kiosk_name")
                    )}
                  >
                    <label htmlFor="kiosk_name" className="control-label">
                      ชื่อตู้ KIOSK
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="kiosk_name"
                      placeholder="ชื่อตู้ KIOSK"
                      name="kiosk_name"
                      autoComplete="off"
                      onChange={this.handleChangeInputForm}
                      value={this.state.formAttributes.kiosk_name}
                    />
                    <span className="help-block">
                      {(errors.kiosk_name && touched.kiosk_name) ||
                        errors.kiosk_name}
                    </span>
                  </div>
                  <div
                    className={classNames(
                      "form-group",
                      this.hasError(errors, touched, "kiosk_status")
                    )}
                  >
                    <label htmlFor="kiosk_status" className="control-label">
                      สถานะ
                    </label>
                    <Select
                      defaultValue={this.state.formAttributes.kiosk_status}
                      onChange={this.handleChangeSelect}
                      value={this.state.formAttributes.kiosk_status}
                    >
                      <Option value={1}>เปิดใช้งาน</Option>
                      <Option value={0}>ปิดใช้งาน</Option>
                    </Select>
                    <span className="help-block">
                      {(errors.kiosk_status && touched.kiosk_status) ||
                        errors.kiosk_status}
                    </span>
                  </div>
                  <div className="form-group hidden">
                    <Button type="primary" htmlType="submit">
                      บันทึก
                    </Button>
                  </div>
                </form>
              )}
            </Formik>
          </Modal>
        </Layout>
      </Aux>
    )
  }
}

export default Index
