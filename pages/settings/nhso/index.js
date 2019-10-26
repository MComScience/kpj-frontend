import { Button, Input, Modal, Table } from "antd"
import classNames from "classnames"
import { Formik } from "formik"
import moment from "moment"
import React, { Component } from "react"
import Swal from "sweetalert2"
import * as Yup from "yup"
import axios from "../../../axios"
import Head from "../../../components/head"
import Layout from "../../../components/layout"
import authHandler from "../../../hoc/authHandler"
import Aux from "../../../hoc/Auxiliary"
import { isEmpty } from "../../../utils"

moment.locale("th")

class Index extends Component {
  state = {
    title: "ตั้งค่าโทเค็น",
    loading: false,
    filterKey: "",
    nhsoItems: [],
    modalVisible: false,
    confirmLoading: false,
    formRef: React.createRef(),
    formAttributes: {
      token_cid: "",
      token_key: ""
    }
  }

  componentDidMount() {
    this.fetchToken()
  }

  fetchToken = async () => {
    try {
      this.setState({ loading: true })
      const { data } = await axios.get(`/nhso/index`)
      this.setState({ nhsoItems: data, loading: false })
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
    const { nhsoItems, filterKey } = this.state
    const data = []
    if (nhsoItems.length) {
      if (filterKey) {
        const newItems = nhsoItems.filter(function(row) {
          return Object.keys(row).some(function(key) {
            return (
              String(row[key])
                .toLowerCase()
                .indexOf(filterKey) > -1
            )
          })
        })
        newItems.map((item, index) => {
          data.push(Object.assign(item, { key: index + 1 }))
        })
      } else {
        nhsoItems.map((item, index) => {
          data.push(Object.assign(item, { key: index + 1 }))
        })
      }
    }
    return data
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
            .delete(`/nhso/delete/${data.id}`)
            .then(res => {
              _this.fetchToken()
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

  handleSubmit = event => {
    event.preventDefault()
  }

  handleChangeInput = event => {
    this.setState({ filterKey: event.target.value })
  }

  showModal = () => {
    this.setState({
      modalVisible: true
    })
  }

  handleOk = e => {
    this.handleSubmit(this.state.formAttributes)
  }

  handleCancel = e => {
    this.setState({
      modalVisible: false
    })
  }

  handleSubmit = async values => {
    this.setState({ confirmLoading: true })
    try {
      const { data } = await axios.put(`/nhso/create`, values)
      this.setState({ confirmLoading: false, modalVisible: false })
      Swal.fire({
        type: "success",
        title: "Success!",
        text: data.message,
        showConfirmButton: false,
        timer: 3000
      })
      this.fetchToken()
    } catch (error) {
      this.setState({ confirmLoading: false })
      Swal.fire({
        type: "error",
        title: "Oops...",
        text: error.message
      })
    }
  }

  handleChangeInputForm = e => {
    const formAttributes = this.state.formAttributes
    const updatedFormAttributes = Object.assign(formAttributes, {
      [e.target.id]: e.target.value
    })
    this.setState({ formAttributes: updatedFormAttributes })
  }

  hasError = (errors, touched, field) => {
    const isError = !isEmpty((errors[field] && touched[field]) || errors[field])
    return isError ? "has-error" : ""
  }

  handleSubmitSearch = e => {
    e.preventDefault()
  }

  render() {
    const columns = [
      {
        title: "ไอดี",
        dataIndex: "id",
        key: "id",
        render: text => <a>{text}</a>,
        sorter: true
      },
      {
        title: "เลขบัตรประชาชน",
        dataIndex: "token_cid",
        key: "token_cid",
        sorter: true
      },
      {
        title: "รหัสโทเค็นคีย์",
        dataIndex: "token_key",
        key: "token_key",
        sorter: true
      },
      {
        title: "วันที่แก้ไข",
        dataIndex: "updated_at",
        key: "updated_at",
        sorter: true,
        render: text => (
          <span>{moment(text).format("DD/MM/YYYY HH:mm:ss")}</span>
        )
      },
      {
        title: "Action",
        key: "action",
        align: "center",
        render: (text, record) => (
          <span>
            <Button type="danger" onClick={() => this.onDelete(record)}>
              ลบ
            </Button>
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
                              onChange={this.handleChangeInput}
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
                        rowKey="id"
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
                token_cid: Yup.string()
                  .min(13)
                  .required(),
                token_key: Yup.string().required()
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
                <form onSubmit={handleSubmit} ref={this.state.formRef}>
                  <div
                    className={classNames(
                      "form-group",
                      this.hasError(errors, touched, "token_cid")
                    )}
                  >
                    <label htmlFor="token_cid" className="control-label">
                      เลขบัตรประชาชน
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="token_cid"
                      placeholder="เลขบัตรประชาชน"
                      name="token_cid"
                      autoComplete="off"
                      onChange={this.handleChangeInputForm}
                      value={values.token_cid}
                    />
                    <span className="help-block">
                      {(errors.token_cid && touched.token_cid) ||
                        errors.token_cid}
                    </span>
                  </div>
                  <div
                    className={classNames(
                      "form-group",
                      this.hasError(errors, touched, "token_key")
                    )}
                  >
                    <label htmlFor="token_key" className="control-label">
                      รหัสโทเค็นคีย์
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="token_key"
                      placeholder="รหัสโทเค็นคีย์"
                      name="token_key"
                      autoComplete="off"
                      onChange={this.handleChangeInputForm}
                      value={values.token_key}
                    />
                    <span className="help-block">
                      {(errors.token_key && touched.token_key) ||
                        errors.token_key}
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

export default authHandler(Index)
